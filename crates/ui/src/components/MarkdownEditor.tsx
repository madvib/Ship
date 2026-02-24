import { ReactNode, useMemo, useRef, useState } from 'react';
import { Binary, Bold, Code2, Italic, Link2, List, Quote, Sparkles, SquarePen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Textarea } from './ui/textarea';

type EditorMode = 'edit' | 'preview' | 'split';

interface MarkdownEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  defaultMode?: EditorMode;
  mcpEnabled?: boolean;
  onMcpSample?: () => Promise<string | null | undefined> | string | null | undefined;
}

export function renderMarkdownPreview(text: string): ReactNode {
  const lines = text.split('\n');
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];

  const flushList = (keyPrefix: string) => {
    if (listItems.length === 0) return;
    nodes.push(
      <ul key={`${keyPrefix}-${nodes.length}`} className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
        {listItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
    listItems = [];
  };

  const flushCode = (keyPrefix: string) => {
    if (codeBuffer.length === 0) return;
    nodes.push(
      <pre key={`${keyPrefix}-${nodes.length}`} className="overflow-x-auto rounded-md border bg-muted/40 p-3 text-xs">
        <code>{codeBuffer.join('\n')}</code>
      </pre>
    );
    codeBuffer = [];
  };

  lines.forEach((line, index) => {
    if (line.startsWith('```')) {
      flushList(`list-${index}`);
      if (inCodeBlock) {
        flushCode(`code-${index}`);
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2));
      return;
    }

    flushList(`list-${index}`);

    if (!line.trim()) {
      nodes.push(<div key={index} className="h-2" />);
      return;
    }

    if (line.startsWith('### ')) {
      nodes.push(
        <h3 key={index} className="text-sm font-semibold">
          {line.slice(4)}
        </h3>
      );
      return;
    }
    if (line.startsWith('## ')) {
      nodes.push(
        <h2 key={index} className="text-base font-semibold">
          {line.slice(3)}
        </h2>
      );
      return;
    }
    if (line.startsWith('# ')) {
      nodes.push(
        <h1 key={index} className="text-lg font-semibold">
          {line.slice(2)}
        </h1>
      );
      return;
    }
    if (line.startsWith('> ')) {
      nodes.push(
        <blockquote key={index} className="text-muted-foreground border-l-2 pl-3 text-sm italic">
          {line.slice(2)}
        </blockquote>
      );
      return;
    }
    nodes.push(
      <p key={index} className="text-muted-foreground text-sm leading-relaxed">
        {line}
      </p>
    );
  });

  flushList('list-final');
  flushCode('code-final');
  return <div className="space-y-2">{nodes}</div>;
}

export default function MarkdownEditor({
  label,
  value,
  onChange,
  placeholder,
  rows = 12,
  defaultMode = 'split',
  mcpEnabled = false,
  onMcpSample,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [mode, setMode] = useState<EditorMode>(defaultMode);
  const [sampling, setSampling] = useState(false);
  const [sampleUndoState, setSampleUndoState] = useState<{ before: string; after: string } | null>(null);
  const preview = useMemo(() => renderMarkdownPreview(value), [value]);

  const updateWithSelection = (transform: (current: string, start: number, end: number) => string) => {
    const target = textareaRef.current;
    if (!target) return;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    onChange(transform(value, start, end));
    requestAnimationFrame(() => {
      target.focus();
      target.selectionStart = start;
      target.selectionEnd = end;
    });
  };

  const wrapSelection = (prefix: string, suffix = prefix) => {
    updateWithSelection((current, start, end) => {
      const selected = current.slice(start, end);
      return `${current.slice(0, start)}${prefix}${selected}${suffix}${current.slice(end)}`;
    });
  };

  const prefixLine = (prefix: string) => {
    updateWithSelection((current, start) => {
      const lineStart = current.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      return `${current.slice(0, lineStart)}${prefix}${current.slice(lineStart)}`;
    });
  };

  const insertSnippet = (snippet: string) => {
    updateWithSelection((current, start, end) => {
      return `${current.slice(0, start)}${snippet}${current.slice(end)}`;
    });
  };

  const triggerSample = async () => {
    if (!onMcpSample || sampling) return;
    try {
      setSampling(true);
      const next = await onMcpSample();
      if (next && next.trim()) {
        const scaffold = next.trim();
        const current = value.trimEnd();
        const combined = current ? `${current}\n\n${scaffold}` : scaffold;
        setSampleUndoState({ before: value, after: combined });
        onChange(combined);
      }
    } finally {
      setSampling(false);
    }
  };

  const undoSample = () => {
    if (!sampleUndoState) return;
    onChange(sampleUndoState.before);
    setSampleUndoState(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{label}</Label>
        <Tabs value={mode} onValueChange={(next) => next && setMode(next as EditorMode)} className="gap-0">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="split">Split</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-wrap items-center gap-1 rounded-md border bg-muted/30 p-1.5">
        <Button type="button" variant="ghost" size="xs" onClick={() => prefixLine('# ')}>
          <SquarePen className="size-3.5" />
          H1
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={() => prefixLine('## ')}>
          H2
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={() => wrapSelection('**')}>
          <Bold className="size-3.5" />
          Bold
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={() => wrapSelection('*')}>
          <Italic className="size-3.5" />
          Italic
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={() => prefixLine('- ')}>
          <List className="size-3.5" />
          List
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={() => prefixLine('> ')}>
          <Quote className="size-3.5" />
          Quote
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={() => wrapSelection('`')}>
          <Code2 className="size-3.5" />
          Inline
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={() => insertSnippet('\n```\n\n```\n')}>
          <Binary className="size-3.5" />
          Block
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={() => insertSnippet('[text](https://)')}>
          <Link2 className="size-3.5" />
          Link
        </Button>
        <div className="ml-auto">
          <Button
            type="button"
            variant="outline"
            size="xs"
            disabled={!mcpEnabled || !onMcpSample || sampling}
            onClick={triggerSample}
            title={mcpEnabled ? 'Append a sampled draft below your current content' : 'Enable MCP in settings'}
          >
            <Sparkles className="size-3.5" />
            {sampling ? 'Sampling…' : 'Insert Sample'}
          </Button>
          {sampleUndoState && value === sampleUndoState.after && (
            <Button type="button" variant="outline" size="xs" onClick={undoSample}>
              Undo Sample
            </Button>
          )}
        </div>
      </div>

      <div className={cn(mode === 'split' && 'grid gap-2 lg:grid-cols-2')}>
        {mode !== 'preview' && (
          <Textarea
            ref={textareaRef}
            rows={rows}
            value={value}
            placeholder={placeholder}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-56"
          />
        )}
        {mode !== 'edit' && (
          <div className="min-h-56 rounded-md border bg-muted/30 p-3">
            {value.trim() ? preview : <p className="text-muted-foreground text-sm">Nothing to preview yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
