import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Maximize2, Minimize2, Sparkles, SquarePen } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CustomMilkdownEditor from './CustomMilkdownEditor';
import FrontmatterPanel from './FrontmatterPanel';
import {
  composeFrontmatterDocument,
  FrontmatterDelimiter,
  parseFrontmatterEntries,
  splitFrontmatterDocument,
} from './frontmatter';

type EditorMode = 'doc' | 'raw';
type LegacyEditorMode = 'edit' | 'preview' | 'split';

export interface MarkdownEditorProps {
  label?: string;
  toolbarStart?: ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  defaultMode?: EditorMode | LegacyEditorMode;
  mcpEnabled?: boolean;
  onMcpSample?: () => Promise<string | null | undefined> | string | null | undefined;
  sampleLabel?: string;
  sampleRequiresMcp?: boolean;
  sampleInline?: boolean;
  showStats?: boolean;
  fillHeight?: boolean;
  showFrontmatter?: boolean;
  frontmatterPanel?:
    | ReactNode
    | ((args: {
        frontmatter: string | null;
        delimiter: FrontmatterDelimiter | null;
        onChange: (frontmatter: string | null, delimiter: FrontmatterDelimiter) => void;
      }) => ReactNode);
}

function normalizeMode(defaultMode?: EditorMode | LegacyEditorMode): EditorMode {
  if (defaultMode === 'raw' || defaultMode === 'preview') return 'raw';
  return 'doc';
}

function normalizeFrontmatterInput(frontmatter: string): string | null {
  const trimmed = frontmatter.trim();
  return trimmed ? frontmatter.trimEnd() : null;
}

export default function MarkdownEditor({
  label,
  toolbarStart,
  value,
  onChange,
  placeholder,
  rows = 12,
  defaultMode = 'doc',
  mcpEnabled = false,
  onMcpSample,
  sampleLabel,
  sampleRequiresMcp = true,
  showStats = true,
  fillHeight = false,
  showFrontmatter = true,
  frontmatterPanel,
}: MarkdownEditorProps) {
  const onChangeRef = useRef(onChange);
  const internalMarkdownRef = useRef(value);

  const [mode, setMode] = useState<EditorMode>(normalizeMode(defaultMode));
  const [sampling, setSampling] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [frontmatterOpen, setFrontmatterOpen] = useState(false);
  const [sampleUndoState, setSampleUndoState] = useState<{ before: string; after: string } | null>(null);
  const [internalMarkdown, setInternalMarkdown] = useState(value);

  const minHeightPx = Math.max(rows, 8) * 24;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setInternalMarkdown((current) => (current === value ? current : value));
    internalMarkdownRef.current = value;
  }, [value]);

  const model = useMemo(() => splitFrontmatterDocument(internalMarkdown), [internalMarkdown]);
  const frontmatterEntries = useMemo(() => parseFrontmatterEntries(model.frontmatter), [model.frontmatter]);
  const wordCount = useMemo(() => {
    const trimmed = model.body.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [model.body]);

  const frontmatterRows = Math.min(Math.max((model.frontmatter?.split(/\r?\n/).length ?? 3) + 1, 4), 12);
  const activeDelimiter: FrontmatterDelimiter = model.delimiter ?? '+++';

  const resolvedSampleLabel = sampleLabel ?? (sampleRequiresMcp ? 'Generate Draft' : 'Insert Template');
  const sampleDisabled = sampling || !onMcpSample || (sampleRequiresMcp && !mcpEnabled);
  const frontmatterAvailable = !!frontmatterPanel || showFrontmatter;
  const metadataManagedExternally = !!frontmatterPanel;

  const handleEditorChange = (next: string) => {
    if (next === internalMarkdownRef.current) return;
    internalMarkdownRef.current = next;
    setInternalMarkdown(next);
    onChangeRef.current(next);
  };

  const handleBodyChange = (body: string) => {
    handleEditorChange(composeFrontmatterDocument(model.frontmatter, body, activeDelimiter));
  };

  const handleFrontmatterChange = (
    frontmatter: string | null,
    delimiter: FrontmatterDelimiter = activeDelimiter
  ) => {
    handleEditorChange(composeFrontmatterDocument(frontmatter, model.body, delimiter));
  };

  const triggerSample = async () => {
    if (!onMcpSample || sampling) return;

    try {
      setSampling(true);
      const sample = await onMcpSample();
      if (!sample || !sample.trim()) return;

      const scaffold = splitFrontmatterDocument(sample.trim());
      const current = splitFrontmatterDocument(internalMarkdown);

      let mergedFrontmatter = current.frontmatter;
      let mergedDelimiter: FrontmatterDelimiter = current.delimiter ?? '+++';
      if (!mergedFrontmatter && scaffold.frontmatter) {
        mergedFrontmatter = scaffold.frontmatter;
        mergedDelimiter = scaffold.delimiter ?? '+++';
      }

      const currentBody = current.body.trimEnd();
      const scaffoldBody = scaffold.body.trim();
      const mergedBody =
        currentBody && scaffoldBody
          ? `${currentBody}\n\n${scaffoldBody}`
          : currentBody || scaffoldBody;

      const combined = composeFrontmatterDocument(mergedFrontmatter, mergedBody, mergedDelimiter);
      setSampleUndoState({ before: internalMarkdown, after: combined });
      handleEditorChange(combined);
    } finally {
      setSampling(false);
    }
  };

  const undoSample = () => {
    if (!sampleUndoState) return;
    handleEditorChange(sampleUndoState.before);
    setSampleUndoState(null);
  };

  const handleRawFrontmatterChange = (frontmatter: string) => {
    handleFrontmatterChange(normalizeFrontmatterInput(frontmatter));
  };

  const handleRawBodyChange = (body: string) => {
    handleBodyChange(body);
  };

  const addFrontmatter = () => {
    if (model.frontmatter) return;
    handleFrontmatterChange('status = "draft"\ntags = ["editor"]', '+++');
  };

  const removeFrontmatter = () => {
    if (!model.frontmatter) return;
    handleFrontmatterChange(null);
  };

  const panelStyle = fillHeight ? undefined : { height: `${minHeightPx}px` };
  const renderedFrontmatterPanel =
    typeof frontmatterPanel === 'function'
      ? frontmatterPanel({
          frontmatter: model.frontmatter,
          delimiter: model.delimiter,
          onChange: handleFrontmatterChange,
        })
      : frontmatterPanel;

  return (
    <div
      className={cn(
        fillHeight ? 'flex h-full min-h-0 flex-col gap-1' : 'space-y-1',
        expanded && 'fixed inset-0 z-[120] bg-background p-1 shadow-2xl md:p-2'
      )}
    >
      <div className="flex items-center gap-1 overflow-x-auto">
        {(label || toolbarStart) && (
          <div className="flex shrink-0 items-center gap-1">
            {label && <Label>{label}</Label>}
            {toolbarStart}
          </div>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1">
          {frontmatterAvailable && (
            <Button type="button" variant="outline" size="xs" onClick={() => setFrontmatterOpen((open) => !open)}>
              <SquarePen className="size-3.5" />
              Metadata
              {frontmatterOpen ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </Button>
          )}

          {onMcpSample && (
            <>
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={sampleDisabled}
                onClick={triggerSample}
                title={sampleRequiresMcp ? 'Use AI to generate draft content' : 'Insert a starter template'}
              >
                <Sparkles className="size-3.5" />
                {sampling ? 'Working…' : resolvedSampleLabel}
              </Button>
              {sampleUndoState && internalMarkdown === sampleUndoState.after && (
                <Button type="button" variant="outline" size="xs" onClick={undoSample}>
                  Undo
                </Button>
              )}
            </>
          )}

          {showStats && (
            <span className="text-xs text-muted-foreground">
              {wordCount} words · {internalMarkdown.length} chars
            </span>
          )}

          <Tabs value={mode} onValueChange={(next) => next && setMode(next as EditorMode)} className="gap-0">
            <TabsList>
              <TabsTrigger value="doc">Doc</TabsTrigger>
              <TabsTrigger value="raw">Raw</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button type="button" variant="ghost" size="icon-sm" onClick={() => setExpanded((current) => !current)}>
            {expanded ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
          </Button>
        </div>
      </div>

      {frontmatterAvailable && frontmatterOpen && (
        renderedFrontmatterPanel ?? (
          <FrontmatterPanel
            frontmatter={model.frontmatter}
            delimiter={model.delimiter}
            onChange={handleFrontmatterChange}
          />
        )
      )}

      <div className={cn(fillHeight && 'min-h-0 flex-1', mode === 'raw' && 'grid gap-1 lg:grid-cols-2')}>
        {mode === 'doc' && (
          <div className={cn(fillHeight ? 'flex h-full min-h-0 flex-col gap-1' : 'space-y-1')}>
            <div className={cn(fillHeight && 'min-h-0 flex-1')}>
              <CustomMilkdownEditor
                value={model.body}
                onChange={handleBodyChange}
                placeholder={placeholder}
                fillHeight={fillHeight}
                minHeightPx={minHeightPx}
              />
            </div>
          </div>
        )}

        {mode === 'raw' && (
          <div className={cn('rounded-md border bg-card', fillHeight && 'h-full min-h-0')} style={panelStyle}>
            <div className="flex h-full min-h-0 flex-col overflow-hidden">
              {!metadataManagedExternally && (
                <div className="border-b px-2 py-1">
                  {model.frontmatter ? (
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                          Metadata ({activeDelimiter})
                        </span>
                        <Button type="button" variant="ghost" size="xs" onClick={removeFrontmatter}>
                          Remove
                        </Button>
                      </div>
                      <Textarea
                        rows={frontmatterRows}
                        value={model.frontmatter}
                        onChange={(event) => handleRawFrontmatterChange(event.target.value)}
                        className="font-mono text-xs leading-5"
                      />
                    </div>
                  ) : (
                    <Button type="button" variant="outline" size="xs" onClick={addFrontmatter}>
                      Add Metadata
                    </Button>
                  )}
                </div>
              )}
              <div className="min-h-0 flex-1 p-1.5">
                <Textarea
                  value={model.body}
                  onChange={(event) => handleRawBodyChange(event.target.value)}
                  className="h-full min-h-0 resize-none font-mono text-sm leading-6"
                />
              </div>
            </div>
          </div>
        )}

        {mode === 'raw' && (
          <div
            className={cn('ship-markdown-preview rounded-md border bg-background', fillHeight && 'h-full min-h-0')}
            style={panelStyle}
          >
            {model.frontmatter && !metadataManagedExternally && (
              <section className="ship-markdown-frontmatter">
                <div className="text-muted-foreground border-b px-3 py-2 text-[11px] font-medium uppercase tracking-wide">
                  Metadata
                </div>
                {frontmatterEntries.length > 0 ? (
                  <dl className="grid gap-x-3 gap-y-1 px-3 py-2 text-xs md:grid-cols-[9rem_1fr]">
                    {frontmatterEntries.map((entry) => (
                      <div key={`${entry.key}-${entry.value}`} className="contents">
                        <dt className="text-muted-foreground font-medium">{entry.key}</dt>
                        <dd className="font-mono break-words">{entry.value || '""'}</dd>
                      </div>
                    ))}
                  </dl>
                ) : (
                  <pre className="whitespace-pre-wrap break-words px-3 py-2 text-xs">
                    <code>{model.frontmatter}</code>
                  </pre>
                )}
                <details>
                  <summary>Raw Metadata</summary>
                  <pre>
                    <code>{model.frontmatter}</code>
                  </pre>
                </details>
              </section>
            )}

            {model.body.trim() ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{model.body}</ReactMarkdown>
            ) : model.frontmatter ? (
              <p className="text-muted-foreground text-sm">No body content yet.</p>
            ) : (
              <p className="text-muted-foreground text-sm">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
