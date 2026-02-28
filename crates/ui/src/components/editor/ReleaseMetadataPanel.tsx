import { useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DatePicker from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import AutocompleteInput from '@/components/ui/autocomplete-input';
import {
  FrontmatterDelimiter,
  readFrontmatterBooleanField,
  readFrontmatterStringField,
  readFrontmatterStringListField,
  setFrontmatterBooleanField,
  setFrontmatterStringField,
  setFrontmatterStringListField,
} from './frontmatter';

const RELEASE_STATUSES = ['planned', 'active', 'shipped', 'archived'];

interface ReleaseMetadataPanelProps {
  frontmatter: string | null;
  delimiter: FrontmatterDelimiter | null;
  defaultVersion: string;
  defaultStatus?: string;
  tagSuggestions?: string[];
  onChange: (frontmatter: string | null, delimiter: FrontmatterDelimiter) => void;
}

function createStarterMetadata(
  delimiter: FrontmatterDelimiter,
  version: string,
  status: string
): string {
  if (delimiter === '---') {
    return `version: "${version}"\nstatus: "${status}"\nsupported: false\ntags: []`;
  }
  return `version = "${version}"\nstatus = "${status}"\nsupported = false\ntags = []`;
}

export default function ReleaseMetadataPanel({
  frontmatter,
  delimiter,
  defaultVersion,
  defaultStatus = 'planned',
  tagSuggestions = [],
  onChange,
}: ReleaseMetadataPanelProps) {
  const [tagInput, setTagInput] = useState('');
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const currentDelimiter: FrontmatterDelimiter = delimiter ?? '+++';

  const effectiveFrontmatter = frontmatter ?? createStarterMetadata(currentDelimiter, defaultVersion, defaultStatus);
  const version = readFrontmatterStringField(effectiveFrontmatter, 'version') || defaultVersion;
  const status = readFrontmatterStringField(effectiveFrontmatter, 'status') || defaultStatus;
  const supported = readFrontmatterBooleanField(effectiveFrontmatter, 'supported') ?? false;
  const targetDate = readFrontmatterStringField(effectiveFrontmatter, 'target_date');
  const tags = readFrontmatterStringListField(effectiveFrontmatter, 'tags');

  const statusOptions = useMemo(() => {
    if (!status || RELEASE_STATUSES.includes(status)) return RELEASE_STATUSES;
    return [status, ...RELEASE_STATUSES];
  }, [status]);

  const availableTagOptions = tagSuggestions
    .filter((tag) => !tags.includes(tag))
    .map((tag) => ({ value: tag }));

  const commit = (nextFrontmatter: string | null) => onChange(nextFrontmatter, currentDelimiter);

  const updateVersion = (next: string) => {
    commit(setFrontmatterStringField(effectiveFrontmatter, 'version', next, currentDelimiter));
  };

  const updateStatus = (next: string) => {
    commit(setFrontmatterStringField(effectiveFrontmatter, 'status', next, currentDelimiter));
  };

  const updateSupported = (next: boolean) => {
    commit(setFrontmatterBooleanField(effectiveFrontmatter, 'supported', next, currentDelimiter));
  };

  const updateTargetDate = (next: string) => {
    commit(setFrontmatterStringField(effectiveFrontmatter, 'target_date', next, currentDelimiter));
  };

  const updateTags = (nextTags: string[]) => {
    commit(setFrontmatterStringListField(effectiveFrontmatter, 'tags', nextTags, currentDelimiter));
  };

  const addTag = (valueOverride?: string) => {
    const clean = (valueOverride ?? tagInput).trim();
    if (!clean || tags.includes(clean)) return;
    updateTags([...tags, clean]);
    setTagInput('');
  };

  return (
    <section className="rounded-md border bg-card px-2.5 py-2">
      <div className="grid gap-x-2 gap-y-1.5 md:grid-cols-2">
        <div className="space-y-0.5">
          <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Version</label>
          <Input
            value={version}
            className="h-8"
            placeholder="v0.1.0-alpha"
            onChange={(event) => updateVersion(event.target.value)}
          />
        </div>

        <div className="space-y-0.5">
          <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Status</label>
          <AutocompleteInput
            value={status}
            options={statusOptions.map((value) => ({ value }))}
            placeholder="Status"
            className="h-8"
            noResultsText="No status matches."
            onValueChange={updateStatus}
          />
        </div>

        <div className="space-y-0.5">
          <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Target Date</label>
          <DatePicker value={targetDate} className="w-full" onValueChange={updateTargetDate} />
        </div>

        <div className="space-y-0.5">
          <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Supported</label>
          <div className="border-input bg-background/50 flex h-8 items-center rounded-md border px-2">
            <Switch checked={supported} onCheckedChange={updateSupported} />
          </div>
        </div>

        <div className="space-y-0.5 md:col-span-2">
          <label className="text-muted-foreground mb-0.5 block text-xs font-medium uppercase tracking-wide">
            Tags {tags.length ? `(${tags.length})` : ''}
          </label>
          <div className="border-input bg-background/50 flex min-h-8 flex-wrap items-center gap-1.5 rounded-md border px-1.5 py-1">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" className="h-6 gap-1 text-[11px]">
                {tag}
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remove tag ${tag}`}
                  onClick={() => updateTags(tags.filter((value) => value !== tag))}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}

            {tagInputOpen ? (
              <div className="flex min-w-[220px] flex-1 items-center gap-1">
                <AutocompleteInput
                  value={tagInput}
                  options={availableTagOptions}
                  className="h-6 w-full"
                  autoFocus
                  placeholder="Add tag"
                  noResultsText="No tag suggestions."
                  onCommit={(value) => {
                    addTag(value);
                    setTagInputOpen(false);
                  }}
                  onValueChange={setTagInput}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  className="h-6 w-6 shrink-0"
                  aria-label="Confirm add tag"
                  disabled={!tagInput.trim()}
                  onClick={() => {
                    addTag(tagInput);
                    setTagInputOpen(false);
                  }}
                >
                  <Check className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="h-6 w-6 shrink-0"
                  aria-label="Cancel add tag"
                  onClick={() => {
                    setTagInput('');
                    setTagInputOpen(false);
                  }}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                className="h-6 w-6 shrink-0"
                title="Add tag"
                aria-label="Add tag"
                onClick={() => {
                  setTagInput('');
                  setTagInputOpen(true);
                }}
              >
                <Plus className="size-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
