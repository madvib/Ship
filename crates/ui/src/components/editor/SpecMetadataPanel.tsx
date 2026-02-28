import { useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AutocompleteInput from '@/components/ui/autocomplete-input';
import {
  FrontmatterDelimiter,
  readFrontmatterStringField,
  readFrontmatterStringListField,
  setFrontmatterStringField,
  setFrontmatterStringListField,
} from './frontmatter';

const SPEC_STATUSES = ['draft', 'active', 'archived'];

interface SpecMetadataPanelProps {
  frontmatter: string | null;
  delimiter: FrontmatterDelimiter | null;
  defaultTitle: string;
  defaultStatus?: string;
  tagSuggestions?: string[];
  onChange: (frontmatter: string | null, delimiter: FrontmatterDelimiter) => void;
}

function createStarterMetadata(
  delimiter: FrontmatterDelimiter,
  title: string,
  status: string
): string {
  if (delimiter === '---') {
    return `title: "${title}"\nstatus: "${status}"\nauthor: ""\ntags: []`;
  }
  return `title = "${title}"\nstatus = "${status}"\nauthor = ""\ntags = []`;
}

export default function SpecMetadataPanel({
  frontmatter,
  delimiter,
  defaultTitle,
  defaultStatus = 'draft',
  tagSuggestions = [],
  onChange,
}: SpecMetadataPanelProps) {
  const [tagInput, setTagInput] = useState('');
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const currentDelimiter: FrontmatterDelimiter = delimiter ?? '+++';

  const effectiveFrontmatter = frontmatter ?? createStarterMetadata(currentDelimiter, defaultTitle, defaultStatus);
  const title = readFrontmatterStringField(effectiveFrontmatter, 'title') || defaultTitle;
  const status = readFrontmatterStringField(effectiveFrontmatter, 'status') || defaultStatus;
  const author = readFrontmatterStringField(effectiveFrontmatter, 'author');
  const tags = readFrontmatterStringListField(effectiveFrontmatter, 'tags');

  const statusOptions = useMemo(() => {
    if (!status || SPEC_STATUSES.includes(status)) return SPEC_STATUSES;
    return [status, ...SPEC_STATUSES];
  }, [status]);

  const availableTagOptions = tagSuggestions
    .filter((tag) => !tags.includes(tag))
    .map((value) => ({ value }));

  const commit = (nextFrontmatter: string | null) => onChange(nextFrontmatter, currentDelimiter);

  const updateField = (key: string, value: string) => {
    commit(setFrontmatterStringField(effectiveFrontmatter, key, value, currentDelimiter));
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
          <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Title</label>
          <Input
            value={title}
            className="h-8"
            placeholder="Spec title"
            onChange={(event) => updateField('title', event.target.value)}
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
            onValueChange={(value) => updateField('status', value)}
          />
        </div>

        <div className="space-y-0.5 md:col-span-2">
          <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Author</label>
          <Input
            value={author}
            className="h-8"
            placeholder="Author"
            onChange={(event) => updateField('author', event.target.value)}
          />
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
