import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { ModeConfig, ProjectConfig } from '@/bindings';
import { exportAgentConfigCmd, generateIssueDescriptionCmd } from '@/lib/platform/tauri/commands';
import { DEFAULT_STATUSES } from '@/lib/workspace-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageFrame, PageHeader } from '@/components/app/PageFrame';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import MarkdownEditor from '@/components/editor';

interface AgentsPanelProps {
  projectConfig: ProjectConfig | null;
  globalAgentConfig: ProjectConfig | null;
  onSaveProject: (config: ProjectConfig) => void | Promise<void>;
  onSaveGlobalAgentConfig: (config: ProjectConfig) => void | Promise<void>;
  initialSection?: AgentSection;
}

type ScopeKey = 'global' | 'project';
type MarkdownDocKind = 'skills' | 'rules';

type AgentDoc = {
  id: string;
  title: string;
  content: string;
  updated: string;
};

export type AgentSection = 'providers' | 'mcp' | 'skills' | 'rules' | 'permissions';

const AI_PROVIDERS = [
  { id: 'claude', label: 'Claude' },
  { id: 'gemini', label: 'Gemini' },
  { id: 'codex', label: 'Codex' },
];

const EMPTY_AGENT_LAYER = {
  skills: [],
  prompts: [],
  context: [],
  rules: [],
};

const DEFAULT_MODE_VALUE = 'default';

const DEFAULT_PERMISSIONS_TOML = `# Draft permissions (UI-only until API lands)
allow = [
  "ship_list_issues",
  "ship_get_issue",
  "ship_update_issue"
]

deny = [
  "ship_delete_issue"
]
`;

const SECTION_META: Record<AgentSection, { title: string; description: string }> = {
  providers: {
    title: 'Providers',
    description: 'Choose provider/model defaults and mode controls.',
  },
  mcp: {
    title: 'MCP Servers',
    description: 'Edit MCP server snippets and sync client configs.',
  },
  skills: {
    title: 'Skills',
    description: 'Markdown skill docs with list + editor workflow.',
  },
  rules: {
    title: 'Rules',
    description: 'Markdown rules docs with list + editor workflow.',
  },
  permissions: {
    title: 'Permissions',
    description: 'Draft per-scope allow/deny snippets (API integration pending).',
  },
};

const EMPTY_MODE: ModeConfig = {
  id: '',
  name: '',
  description: null,
  active_tools: [],
  mcp_servers: [],
};

function normalizeAiConfig(ai: ProjectConfig['ai']) {
  return {
    provider: ai?.provider ?? 'claude',
    model: ai?.model ?? null,
    cli_path: ai?.cli_path ?? null,
  };
}

function normalizeProjectConfig(config: ProjectConfig | null): ProjectConfig {
  return {
    version: config?.version ?? '1',
    name: config?.name ?? null,
    description: config?.description ?? null,
    statuses: (config?.statuses?.length ? config.statuses : DEFAULT_STATUSES).map((status) => ({
      id: status.id,
      name: status.name,
      color: status.color ?? 'gray',
    })),
    git: {
      ignore: config?.git?.ignore ?? [],
      commit:
        config?.git?.commit ?? ['releases', 'features', 'adrs', 'specs', 'ship.toml', 'templates'],
    },
    ai: normalizeAiConfig(config?.ai ?? null),
    modes: config?.modes ?? [],
    mcp_servers: config?.mcp_servers ?? [],
    active_mode: config?.active_mode ?? null,
    agent: {
      ...EMPTY_AGENT_LAYER,
      ...(config?.agent ?? {}),
    },
  };
}

function createStubDoc(kind: MarkdownDocKind, title: string): AgentDoc {
  const isSkill = kind === 'skills';
  return {
    id: `${kind}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title,
    updated: new Date().toISOString(),
    content: isSkill
      ? `# ${title}\n\n## Intent\n\n## Inputs\n\n## Output\n\n## Guardrails\n`
      : `# ${title}\n\n## Rule\n\n## Rationale\n\n## Examples\n`,
  };
}

function formatUpdated(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AgentsPanel({
  projectConfig,
  globalAgentConfig,
  onSaveProject,
  onSaveGlobalAgentConfig,
  initialSection = 'providers',
}: AgentsPanelProps) {
  const [localProject, setLocalProject] = useState<ProjectConfig>(normalizeProjectConfig(projectConfig));
  const [localGlobalAgent, setLocalGlobalAgent] = useState<ProjectConfig>(
    normalizeProjectConfig(globalAgentConfig)
  );
  const [agentScope, setAgentScope] = useState<ScopeKey>(projectConfig ? 'project' : 'global');
  const [newMode, setNewMode] = useState<ModeConfig>(EMPTY_MODE);
  const [exportStatus, setExportStatus] = useState<Record<string, 'idle' | 'loading' | 'ok' | 'error'>>({});
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [agentError, setAgentError] = useState<string | null>(null);
  const [mcpSnippet, setMcpSnippet] = useState('[]');
  const [mcpSnippetError, setMcpSnippetError] = useState<string | null>(null);
  const [permissionDrafts, setPermissionDrafts] = useState<{ global: string; project: string }>({
    global: DEFAULT_PERMISSIONS_TOML,
    project: DEFAULT_PERMISSIONS_TOML,
  });
  const [docStore, setDocStore] = useState<Record<ScopeKey, Record<MarkdownDocKind, AgentDoc[]>>>(() => ({
    global: {
      skills: [createStubDoc('skills', 'Global Coding Skill')],
      rules: [createStubDoc('rules', 'Global Execution Rules')],
    },
    project: {
      skills: [createStubDoc('skills', 'Project Delivery Skill')],
      rules: [createStubDoc('rules', 'Project Rules')],
    },
  }));
  const [selectedDocIds, setSelectedDocIds] = useState<Record<ScopeKey, Record<MarkdownDocKind, string | null>>>(
    () => ({
      global: {
        skills: null,
        rules: null,
      },
      project: {
        skills: null,
        rules: null,
      },
    })
  );

  useEffect(() => {
    setLocalProject(normalizeProjectConfig(projectConfig));
  }, [projectConfig]);

  useEffect(() => {
    setLocalGlobalAgent(normalizeProjectConfig(globalAgentConfig));
  }, [globalAgentConfig]);

  useEffect(() => {
    if (!projectConfig) {
      setAgentScope('global');
    }
  }, [projectConfig]);

  const hasActiveProject = !!projectConfig;
  const activeAgentConfig = useMemo(
    () => (agentScope === 'project' ? localProject : localGlobalAgent),
    [agentScope, localGlobalAgent, localProject]
  );
  const activePermissionDraft = permissionDrafts[agentScope];

  useEffect(() => {
    setMcpSnippet(JSON.stringify(activeAgentConfig.mcp_servers ?? [], null, 2));
    setMcpSnippetError(null);
  }, [activeAgentConfig.mcp_servers, agentScope]);

  const activeDocKind: MarkdownDocKind | null =
    initialSection === 'skills' || initialSection === 'rules' ? initialSection : null;

  const activeDocs = activeDocKind ? docStore[agentScope][activeDocKind] : [];
  const activeSelectedDocId = activeDocKind ? selectedDocIds[agentScope][activeDocKind] : null;
  const activeDoc = activeDocs.find((doc) => doc.id === activeSelectedDocId) ?? activeDocs[0] ?? null;

  useEffect(() => {
    if (!activeDocKind) return;
    const docs = docStore[agentScope][activeDocKind];
    const selectedId = selectedDocIds[agentScope][activeDocKind];
    if (docs.length === 0 || docs.some((doc) => doc.id === selectedId)) return;
    setSelectedDocIds((current) => ({
      ...current,
      [agentScope]: {
        ...current[agentScope],
        [activeDocKind]: docs[0]?.id ?? null,
      },
    }));
  }, [activeDocKind, agentScope, docStore, selectedDocIds]);

  const updateActiveAgentConfig = (next: ProjectConfig) => {
    if (agentScope === 'project') {
      setLocalProject(next);
      return;
    }
    setLocalGlobalAgent(next);
  };

  const updatePermissionDraft = (value: string) => {
    setPermissionDrafts((current) => ({ ...current, [agentScope]: value }));
  };

  const handleMcpSnippetChange = (value: string) => {
    setMcpSnippet(value);
    try {
      const parsed = JSON.parse(value) as unknown;
      if (!Array.isArray(parsed)) {
        throw new Error('MCP config must be a JSON array.');
      }
      updateActiveAgentConfig({
        ...activeAgentConfig,
        mcp_servers: parsed as ProjectConfig['mcp_servers'],
      });
      setMcpSnippetError(null);
    } catch (error) {
      setMcpSnippetError(error instanceof Error ? error.message : 'Invalid JSON.');
    }
  };

  const upsertDoc = (kind: MarkdownDocKind, docId: string, patch: Partial<AgentDoc>) => {
    setDocStore((current) => ({
      ...current,
      [agentScope]: {
        ...current[agentScope],
        [kind]: current[agentScope][kind].map((doc) =>
          doc.id === docId ? { ...doc, ...patch, updated: new Date().toISOString() } : doc
        ),
      },
    }));
  };

  const createDoc = (kind: MarkdownDocKind) => {
    const isSkill = kind === 'skills';
    const doc = createStubDoc(kind, isSkill ? 'Untitled Skill' : 'Untitled Rule');
    setDocStore((current) => ({
      ...current,
      [agentScope]: {
        ...current[agentScope],
        [kind]: [doc, ...current[agentScope][kind]],
      },
    }));
    setSelectedDocIds((current) => ({
      ...current,
      [agentScope]: {
        ...current[agentScope],
        [kind]: doc.id,
      },
    }));
  };

  const handleAddMode = () => {
    const id = newMode.id.trim();
    const name = newMode.name.trim();
    if (!id || !name) return;
    updateActiveAgentConfig({
      ...activeAgentConfig,
      modes: [...(activeAgentConfig.modes ?? []), { ...newMode, id, name }],
    });
    setNewMode(EMPTY_MODE);
  };

  const handleRemoveMode = (id: string) => {
    updateActiveAgentConfig({
      ...activeAgentConfig,
      modes: (activeAgentConfig.modes ?? []).filter((m) => m.id !== id),
      active_mode: activeAgentConfig.active_mode === id ? null : activeAgentConfig.active_mode,
    });
  };

  const handleSetActiveMode = (id: string | null) => {
    const next = id === DEFAULT_MODE_VALUE ? null : id;
    updateActiveAgentConfig({ ...activeAgentConfig, active_mode: next });
  };

  const handleTestProvider = async () => {
    setTestStatus('loading');
    setAgentError(null);
    try {
      await generateIssueDescriptionCmd('test task');
      setTestStatus('ok');
    } catch (err) {
      setTestStatus('error');
      setAgentError(String(err));
    }
  };

  const handleExport = async (target: 'claude' | 'codex' | 'gemini') => {
    setExportStatus((prev) => ({ ...prev, [target]: 'loading' }));
    setAgentError(null);
    try {
      await exportAgentConfigCmd(target);
      setExportStatus((prev) => ({ ...prev, [target]: 'ok' }));
    } catch (err) {
      setExportStatus((prev) => ({ ...prev, [target]: 'error' }));
      setAgentError(String(err));
    }
  };

  const handleSave = () => {
    if (agentScope === 'global') {
      return onSaveGlobalAgentConfig(localGlobalAgent);
    }
    return onSaveProject(localProject);
  };

  const sectionMeta = SECTION_META[initialSection];

  return (
    <PageFrame className="md:p-8">
      <PageHeader
        title={sectionMeta.title}
        description={sectionMeta.description}
        badge={<Badge variant="outline">Agents</Badge>}
        actions={
          <div className="flex items-center gap-2 rounded-md border bg-card/70 px-2 py-1.5 shadow-sm">
            <span className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">Scope</span>
            <Select
              value={agentScope}
              onValueChange={(value) => setAgentScope((value as ScopeKey) ?? 'global')}
            >
              <SelectTrigger size="sm" className="h-7 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global</SelectItem>
                <SelectItem value="project" disabled={!hasActiveProject}>
                  Project
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid gap-4">
        {initialSection === 'providers' && (
          <div className="grid gap-4">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Agent Selection</CardTitle>
                <CardDescription>Choose provider and model used by generation features.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 lg:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select
                      value={activeAgentConfig.ai?.provider ?? 'claude'}
                      onValueChange={(value) =>
                        updateActiveAgentConfig({
                          ...activeAgentConfig,
                          ai: { ...normalizeAiConfig(activeAgentConfig.ai), provider: value },
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AI_PROVIDERS.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agents-model">Model</Label>
                    <Input
                      id="agents-model"
                      value={activeAgentConfig.ai?.model ?? ''}
                      onChange={(event) =>
                        updateActiveAgentConfig({
                          ...activeAgentConfig,
                          ai: {
                            ...normalizeAiConfig(activeAgentConfig.ai),
                            model: event.target.value || null,
                          },
                        })
                      }
                      placeholder="haiku / sonnet / gpt-5 / gemini-2.0-flash"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agents-cli-path">CLI Path Override</Label>
                    <Input
                      id="agents-cli-path"
                      value={activeAgentConfig.ai?.cli_path ?? ''}
                      onChange={(event) =>
                        updateActiveAgentConfig({
                          ...activeAgentConfig,
                          ai: {
                            ...normalizeAiConfig(activeAgentConfig.ai),
                            cli_path: event.target.value || null,
                          },
                        })
                      }
                      placeholder="Leave blank to use PATH"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={testStatus === 'loading' || !hasActiveProject}
                    onClick={() => void handleTestProvider()}
                  >
                    {testStatus === 'loading' ? 'Testing…' : 'Test Agent'}
                  </Button>
                  {testStatus === 'ok' && (
                    <span className="text-xs text-emerald-500">Agent working ✓</span>
                  )}
                  {testStatus === 'error' && (
                    <span className="text-xs text-destructive">Failed — check binary/model/path</span>
                  )}
                </div>
                {!hasActiveProject && (
                  <p className="text-muted-foreground text-xs">Open a project to run provider tests.</p>
                )}
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>Modes</CardTitle>
                <CardDescription>Modes define explicit capability boundaries.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label>Active Mode</Label>
                  <Select
                    value={activeAgentConfig.active_mode ?? DEFAULT_MODE_VALUE}
                    onValueChange={handleSetActiveMode}
                  >
                    <SelectTrigger className="w-full sm:w-72">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DEFAULT_MODE_VALUE}>Default (all capabilities)</SelectItem>
                      {(activeAgentConfig.modes ?? []).map((mode) => (
                        <SelectItem key={mode.id} value={mode.id}>
                          {mode.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(activeAgentConfig.modes ?? []).length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      {(activeAgentConfig.modes ?? []).map((mode) => (
                        <div
                          key={mode.id}
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium">{mode.name}</p>
                            <p className="text-muted-foreground text-xs font-mono">{mode.id}</p>
                          </div>
                          <Button variant="ghost" size="xs" onClick={() => handleRemoveMode(mode.id)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <Separator />
                <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Input
                    value={newMode.id}
                    onChange={(e) => setNewMode({ ...newMode, id: e.target.value })}
                    placeholder="mode-id"
                  />
                  <Input
                    value={newMode.name}
                    onChange={(e) => setNewMode({ ...newMode, name: e.target.value })}
                    placeholder="Display Name"
                  />
                  <Button onClick={handleAddMode} disabled={!newMode.id.trim() || !newMode.name.trim()}>
                    <Plus className="size-3.5" />
                    Add Mode
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {initialSection === 'mcp' && (
          <div className="grid gap-4">
            <Card size="sm">
              <CardHeader>
                <CardTitle>MCP Servers</CardTitle>
                <CardDescription>JSON snippet editor for MCP server configuration.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md border bg-card/50">
                  <div className="text-muted-foreground border-b px-3 py-2 text-[11px] font-medium uppercase tracking-wide">
                    JSON
                  </div>
                  <Textarea
                    value={mcpSnippet}
                    onChange={(event) => handleMcpSnippetChange(event.target.value)}
                    rows={16}
                    className="min-h-[340px] resize-y border-0 font-mono text-xs leading-6 shadow-none focus-visible:ring-0"
                    placeholder={'[\n  {\n    "id": "ship",\n    "name": "Shipwright",\n    "command": "ship-mcp",\n    "args": []\n  }\n]'}
                  />
                </div>
                {mcpSnippetError ? (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {mcpSnippetError}
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Parsed {(activeAgentConfig.mcp_servers ?? []).length} server
                    {(activeAgentConfig.mcp_servers ?? []).length === 1 ? '' : 's'}.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>Sync to AI Clients</CardTitle>
                <CardDescription>Export MCP registry and agent docs to client configs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {agentError && (
                  <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {agentError}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {(['claude', 'codex', 'gemini'] as const).map((target) => (
                    <Button
                      key={target}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={exportStatus[target] === 'loading' || !hasActiveProject}
                      onClick={() => void handleExport(target)}
                    >
                      <Upload className="size-3.5" />
                      {exportStatus[target] === 'loading'
                        ? 'Syncing…'
                        : exportStatus[target] === 'ok'
                        ? `Synced to ${target} ✓`
                        : `Sync to ${target}`}
                    </Button>
                  ))}
                </div>
                {!hasActiveProject && (
                  <p className="text-muted-foreground text-xs">Open a project to export client config files.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {(initialSection === 'skills' || initialSection === 'rules') && activeDocKind && (
          <div className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
            <Card size="sm" className="xl:h-[640px]">
              <CardHeader>
                <CardTitle>{initialSection === 'skills' ? 'Skill Docs' : 'Rule Docs'}</CardTitle>
                <CardDescription>Markdown file list (local stub until API integration).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full" onClick={() => createDoc(activeDocKind)}>
                  <Plus className="size-3.5" />
                  New {initialSection === 'skills' ? 'Skill' : 'Rule'}
                </Button>
                <div className="max-h-[500px] space-y-1 overflow-auto pr-1">
                  {activeDocs.map((doc) => {
                    const selected = activeDoc?.id === doc.id;
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        className={`w-full rounded-md border px-2.5 py-2 text-left transition-colors ${
                          selected ? 'border-primary/40 bg-primary/10' : 'hover:bg-muted/50'
                        }`}
                        onClick={() =>
                          setSelectedDocIds((current) => ({
                            ...current,
                            [agentScope]: {
                              ...current[agentScope],
                              [activeDocKind]: doc.id,
                            },
                          }))
                        }
                      >
                        <p className="truncate text-sm font-medium">{doc.title || 'Untitled'}</p>
                        <p className="text-muted-foreground text-xs">{formatUpdated(doc.updated)}</p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card size="sm" className="xl:h-[640px]">
              <CardHeader>
                <CardTitle>{initialSection === 'skills' ? 'Skill Editor' : 'Rules Editor'}</CardTitle>
                <CardDescription>Markdown editor for selected doc (stubbed local state).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!activeDoc ? (
                  <p className="text-muted-foreground text-sm">Create a document to start editing.</p>
                ) : (
                  <>
                    <Input
                      value={activeDoc.title}
                      onChange={(event) => upsertDoc(activeDocKind, activeDoc.id, { title: event.target.value })}
                      placeholder="Document title"
                    />
                    <MarkdownEditor
                      label={undefined}
                      value={activeDoc.content}
                      onChange={(value) => upsertDoc(activeDocKind, activeDoc.id, { content: value })}
                      placeholder={initialSection === 'skills' ? '# Skill' : '# Rule'}
                      rows={18}
                      defaultMode="doc"
                      showFrontmatter={false}
                      showStats={false}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {initialSection === 'permissions' && (
          <div className="grid gap-4">
            <Card size="sm">
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
                <CardDescription>
                  TOML/JSON snippet editor for permissions drafts (UI-only until API lands).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="rounded-md border bg-card/50">
                  <div className="text-muted-foreground border-b px-3 py-2 text-[11px] font-medium uppercase tracking-wide">
                    TOML
                  </div>
                  <Textarea
                    value={activePermissionDraft}
                    onChange={(event) => updatePermissionDraft(event.target.value)}
                    rows={16}
                    className="min-h-[340px] resize-y border-0 font-mono text-xs leading-6 shadow-none focus-visible:ring-0"
                    placeholder={DEFAULT_PERMISSIONS_TOML}
                  />
                </div>
                <p className="text-muted-foreground text-xs">
                  Draft content only. Save behavior will connect once permissions API is implemented.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <footer className="flex items-center justify-end gap-2 border-t pt-4">
        {agentScope === 'global' ? (
          <Button onClick={() => void handleSave()}>Save Global Agent Config</Button>
        ) : (
          <Button onClick={() => void handleSave()} disabled={!projectConfig}>
            Save Project Agent Config
          </Button>
        )}
      </footer>
    </PageFrame>
  );
}
