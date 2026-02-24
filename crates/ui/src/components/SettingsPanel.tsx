import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Config, DEFAULT_STATUSES, GitConfig, ProjectConfig, StatusConfig } from '../types';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';

interface SettingsPanelProps {
  config: Config;
  projectConfig: ProjectConfig | null;
  onThemePreview: (theme?: string) => void;
  onSave: (config: Config) => void;
  onSaveProject: (config: ProjectConfig) => void;
  onBack: () => void;
}

const GIT_CATEGORIES = ['issues', 'adrs', 'specs', 'config.toml', 'templates', 'log.md'];

function normalizeProjectConfig(config: ProjectConfig | null): ProjectConfig {
  return {
    version: config?.version ?? '1',
    name: config?.name ?? null,
    description: config?.description ?? null,
    statuses: (config?.statuses?.length ? config.statuses : DEFAULT_STATUSES).map((status) => ({
      id: status.id,
      name: status.name,
      color: status.color,
    })),
    git: {
      ignore: config?.git?.ignore ?? [],
      commit: config?.git?.commit ?? ['issues', 'adrs', 'specs', 'config.toml', 'templates'],
    },
  };
}

export default function SettingsPanel({
  config,
  projectConfig,
  onThemePreview,
  onSave,
  onSaveProject,
  onBack,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<'global' | 'project'>('global');
  const [local, setLocal] = useState<Config>(config);
  const [localProject, setLocalProject] = useState<ProjectConfig>(normalizeProjectConfig(projectConfig));
  const [newStatus, setNewStatus] = useState<StatusConfig>({ id: '', name: '', color: 'gray' });
  const initialThemeRef = useRef<string | undefined>(config.theme);

  useEffect(() => {
    setLocal(config);
    initialThemeRef.current = config.theme;
  }, [config]);

  useEffect(() => {
    setLocalProject(normalizeProjectConfig(projectConfig));
  }, [projectConfig]);

  useEffect(() => {
    if (!projectConfig && activeTab === 'project') {
      setActiveTab('global');
    }
  }, [activeTab, projectConfig]);

  const availableStatuses = useMemo(
    () => (localProject.statuses.length > 0 ? localProject.statuses : DEFAULT_STATUSES),
    [localProject.statuses]
  );

  const updateStatus = (index: number, patch: Partial<StatusConfig>) => {
    setLocalProject((current) => ({
      ...current,
      statuses: current.statuses.map((status, i) => (i === index ? { ...status, ...patch } : status)),
    }));
  };

  const removeStatus = (index: number) => {
    setLocalProject((current) => ({
      ...current,
      statuses: current.statuses.filter((_, i) => i !== index),
    }));
  };

  const toggleGitCategory = (category: string) => {
    setLocalProject((current) => {
      const git: GitConfig = {
        ignore: [...(current.git?.ignore ?? [])],
        commit: [...(current.git?.commit ?? [])],
      };
      const isCommitted = git.commit.includes(category);
      if (isCommitted) {
        git.commit = git.commit.filter((item) => item !== category);
        if (!git.ignore.includes(category)) git.ignore.push(category);
      } else {
        git.ignore = git.ignore.filter((item) => item !== category);
        git.commit.push(category);
      }
      return { ...current, git };
    });
  };

  const handleAddStatus = () => {
    const id = newStatus.id.trim();
    const name = newStatus.name.trim();
    if (!id || !name) return;
    setLocalProject((current) => ({
      ...current,
      statuses: [...current.statuses, { id, name, color: newStatus.color.trim() || 'gray' }],
    }));
    setNewStatus({ id: '', name: '', color: 'gray' });
  };

  const handleBack = () => {
    onThemePreview(initialThemeRef.current);
    onBack();
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 p-5 md:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Settings</h1>
            <p className="text-muted-foreground text-sm">Global and project configuration</p>
          </div>
        </div>
        <Badge variant="outline">Alpha</Badge>
      </header>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'global' | 'project')}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="global">Global</TabsTrigger>
          <TabsTrigger value="project" disabled={!projectConfig}>
            Project
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card size="sm">
              <CardHeader>
                <CardTitle>User</CardTitle>
                <CardDescription>Name and email used for authorship metadata.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="settings-author">Name</Label>
                  <Input
                    id="settings-author"
                    value={local.author ?? ''}
                    onChange={(event) => setLocal({ ...local, author: event.target.value })}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-email">Email</Label>
                  <Input
                    id="settings-email"
                    value={local.email ?? ''}
                    onChange={(event) => setLocal({ ...local, email: event.target.value })}
                    placeholder="you@example.com"
                  />
                </div>
              </CardContent>
            </Card>

            <Card size="sm">
              <CardHeader>
                <CardTitle>MCP</CardTitle>
                <CardDescription>Local bridge for AI clients and tooling.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="settings-mcp-port">Port</Label>
                  <Input
                    id="settings-mcp-port"
                    type="number"
                    value={local.mcp_port ?? 7700}
                    onChange={(event) => {
                      const nextPort = Number.parseInt(event.target.value, 10);
                      setLocal({
                        ...local,
                        mcp_port: Number.isFinite(nextPort) ? nextPort : 7700,
                      });
                    }}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Enable MCP</p>
                    <p className="text-muted-foreground text-xs">Allow AI clients to connect to Ship context.</p>
                  </div>
                  <Switch
                    checked={local.mcp_enabled !== false}
                    onCheckedChange={(checked) => setLocal({ ...local, mcp_enabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card size="sm" className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Appearance & Defaults</CardTitle>
                <CardDescription>Theme and creation defaults for new issues.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select
                    value={local.theme ?? 'dark'}
                    onValueChange={(value) => {
                      const theme = value ?? undefined;
                      setLocal({ ...local, theme });
                      onThemePreview(theme);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Default Issue Status</Label>
                  <Select
                    value={local.default_status ?? availableStatuses[0]?.id ?? 'backlog'}
                    onValueChange={(value) =>
                      setLocal({ ...local, default_status: value ?? undefined })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="settings-editor">Editor</Label>
                  <Input
                    id="settings-editor"
                    value={local.editor ?? 'code'}
                    onChange={(event) => setLocal({ ...local, editor: event.target.value })}
                    placeholder="code"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="project">
          {!projectConfig ? (
            <Card size="sm">
              <CardHeader>
                <CardTitle>Select a project first</CardTitle>
                <CardDescription>Project settings become available after opening or creating a project.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4">
              <Card size="sm">
                <CardHeader>
                  <CardTitle>Project</CardTitle>
                  <CardDescription>Metadata stored in `.ship/config.toml`.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="settings-project-name">Project Name</Label>
                    <Input
                      id="settings-project-name"
                      value={localProject.name ?? ''}
                      onChange={(event) =>
                        setLocalProject({ ...localProject, name: event.target.value || null })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-project-description">Description</Label>
                    <Textarea
                      id="settings-project-description"
                      rows={3}
                      value={localProject.description ?? ''}
                      onChange={(event) =>
                        setLocalProject({ ...localProject, description: event.target.value || null })
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>Statuses</CardTitle>
                  <CardDescription>Customize issue workflow columns for this project.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="hidden grid-cols-[1fr_1.2fr_1fr_auto] gap-2 px-1 text-xs text-muted-foreground md:grid">
                    <span>ID</span>
                    <span>Name</span>
                    <span>Color</span>
                    <span />
                  </div>
                  {localProject.statuses.map((status, index) => (
                    <div key={`${status.id}-${index}`} className="grid gap-2 md:grid-cols-[1fr_1.2fr_1fr_auto]">
                      <Input
                        value={status.id}
                        onChange={(event) => updateStatus(index, { id: event.target.value })}
                        placeholder="id"
                      />
                      <Input
                        value={status.name}
                        onChange={(event) => updateStatus(index, { name: event.target.value })}
                        placeholder="name"
                      />
                      <Input
                        value={status.color}
                        onChange={(event) => updateStatus(index, { color: event.target.value })}
                        placeholder="color"
                      />
                      <Button variant="destructive" size="xs" onClick={() => removeStatus(index)}>
                        <Trash2 className="size-3.5" />
                        Delete
                      </Button>
                    </div>
                  ))}
                  <Separator />
                  <div className="grid gap-2 md:grid-cols-[1fr_1.2fr_1fr_auto]">
                    <Input
                      value={newStatus.id}
                      onChange={(event) => setNewStatus({ ...newStatus, id: event.target.value })}
                      placeholder="new-id"
                    />
                    <Input
                      value={newStatus.name}
                      onChange={(event) => setNewStatus({ ...newStatus, name: event.target.value })}
                      placeholder="Display Name"
                    />
                    <Input
                      value={newStatus.color}
                      onChange={(event) => setNewStatus({ ...newStatus, color: event.target.value })}
                      placeholder="color"
                    />
                    <Button onClick={handleAddStatus}>
                      <Plus className="size-3.5" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <CardTitle>Git Commit Categories</CardTitle>
                  <CardDescription>Choose which docs are staged by default for project commits.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  {GIT_CATEGORIES.map((category) => {
                    const committed = localProject.git?.commit?.includes(category) ?? false;
                    return (
                      <label key={category} className="flex items-center gap-2 rounded-md border px-3 py-2">
                        <Checkbox checked={committed} onCheckedChange={() => toggleGitCategory(category)} />
                        <span className="flex-1 text-sm">{category}</span>
                        <Badge variant={committed ? 'default' : 'outline'} className="text-[10px]">
                          {committed ? 'Commit' : 'Ignore'}
                        </Badge>
                      </label>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <footer className="flex items-center justify-end gap-2 border-t pt-4">
        <Button variant="ghost" onClick={handleBack}>
          Cancel
        </Button>
        {activeTab === 'global' ? (
          <Button onClick={() => onSave(local)}>Save Global Settings</Button>
        ) : (
          <Button onClick={() => onSaveProject(localProject)} disabled={!projectConfig}>
            Save Project Settings
          </Button>
        )}
      </footer>
    </div>
  );
}
