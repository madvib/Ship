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

const FEATURE_STATUSES = ['active', 'paused', 'complete', 'archived'];

interface FeatureMetadataPanelProps {
  frontmatter: string | null;
  delimiter: FrontmatterDelimiter | null;
  defaultTitle: string;
  defaultStatus?: string;
  releaseSuggestions?: string[];
  specSuggestions?: string[];
  adrSuggestions?: string[];
  tagSuggestions?: string[];
  onChange: (frontmatter: string | null, delimiter: FrontmatterDelimiter) => void;
}

function createStarterMetadata(
  delimiter: FrontmatterDelimiter,
  title: string,
  status: string
): string {
  if (delimiter === '---') {
    return `title: "${title}"\nstatus: "${status}"\nrelease: ""\nspec: ""\nadrs: []\ntags: []`;
  }
  return `title = "${title}"\nstatus = "${status}"\nrelease = ""\nspec = ""\nadrs = []\ntags = []`;
}

export default function FeatureMetadataPanel({
  frontmatter,
  delimiter,
  defaultTitle,
  defaultStatus = 'active',
  releaseSuggestions = [],
  specSuggestions = [],
  adrSuggestions = [],
  tagSuggestions = [],
  onChange,
}: FeatureMetadataPanelProps) {
  const [tagInput, setTagInput] = useState('');
  const [tagInputOpen, setTagInputOpen] = useState(false);
  const [adrInput, setAdrInput] = useState('');
  const [adrInputOpen, setAdrInputOpen] = useState(false);
  const currentDelimiter: FrontmatterDelimiter = delimiter ?? '+++';

  const effectiveFrontmatter = frontmatter ?? createStarterMetadata(currentDelimiter, defaultTitle, defaultStatus);
  const title = readFrontmatterStringField(effectiveFrontmatter, 'title') || defaultTitle;
  const status = readFrontmatterStringField(effectiveFrontmatter, 'status') || defaultStatus;
  const owner = readFrontmatterStringField(effectiveFrontmatter, 'owner');
  const branch = readFrontmatterStringField(effectiveFrontmatter, 'branch');
  const release = readFrontmatterStringField(effectiveFrontmatter, 'release');
  const spec = readFrontmatterStringField(effectiveFrontmatter, 'spec');
  const adrs = readFrontmatterStringListField(effectiveFrontmatter, 'adrs');
  const tags = readFrontmatterStringListField(effectiveFrontmatter, 'tags');

  const statusOptions = useMemo(() => {
    if (!status || FEATURE_STATUSES.includes(status)) return FEATURE_STATUSES;
    return [status, ...FEATURE_STATUSES];
  }, [status]);

  const availableTagOptions = tagSuggestions
    .filter((tag) => !tags.includes(tag))
    .map((value) => ({ value }));
  const availableAdrOptions = adrSuggestions
    .filter((adr) => !adrs.includes(adr))
    .map((value) => ({ value }));

  const commit = (nextFrontmatter: string | null) => onChange(nextFrontmatter, currentDelimiter);

  const updateField = (key: string, value: string) => {
    commit(setFrontmatterStringField(effectiveFrontmatter, key, value, currentDelimiter));
  };

  const updateTags = (nextTags: string[]) => {
    commit(setFrontmatterStringListField(effectiveFrontmatter, 'tags', nextTags, currentDelimiter));
  };

  const updateAdrs = (nextAdrs: string[]) => {
    commit(setFrontmatterStringListField(effectiveFrontmatter, 'adrs', nextAdrs, currentDelimiter));
  };

  const addTag = (valueOverride?: string) => {
    const clean = (valueOverride ?? tagInput).trim();
    if (!clean || tags.includes(clean)) return;
    updateTags([...tags, clean]);
    setTagInput('');
  };

  const addAdr = (valueOverride?: string) => {
    const clean = (valueOverride ?? adrInput).trim();
    if (!clean || adrs.includes(clean)) return;
    updateAdrs([...adrs, clean]);
    setAdrInput('');
  };

  return (
    <section className="rounded-md border bg-card px-2.5 py-2">
      <div className="grid gap-x-2 gap-y-1.5 md:grid-cols-2">
        <div className="space-y-0.5">
          <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Title</label>
          <Input value={title} className="h-8" placeholder="Feature title" onChange={(event) => updateField('title', event.target.value)} />
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

        <div className="space-y-0.5">
          <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Release</label>
          <AutocompleteInput
            value={release}
            options={releaseSuggestions.map((value) => ({ value }))}
            className="h-8"
            placeholder="Unassigned"
            noResultsText="No releases found."
            onValueChange={(value) => updateField('release', value)}
          />
        </div>

        <div className="space-y-0.5">
          <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Spec</label>
          <AutocompleteInput
            value={spec}
            options={specSuggestions.map((value) => ({ value }))}
            className="h-8"
            placeholder="None"
            noResultsText="No specs found."
            onValueChange={(value) => updateField('spec', value)}
          />
        </div>

        <div className="space-y-0.5">
          <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Owner</label>
          <Input value={owner} className="h-8" placeholder="Owner" onChange={(event) => updateField('owner', event.target.value)} />
        </div>

        <div className="space-y-0.5">
          <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Branch</label>
          <Input value={branch} className="h-8" placeholder="feature/..." onChange={(event) => updateField('branch', event.target.value)} />
        </div>

        <div className="space-y-0.5 md:col-span-2">
          <label className="text-muted-foreground mb-0.5 block text-xs font-medium uppercase tracking-wide">
            ADRs {adrs.length ? `(${adrs.length})` : ''}
          </label>
          <div className="border-input bg-background/50 flex min-h-8 flex-wrap items-center gap-1.5 rounded-md border px-1.5 py-1">
            {adrs.map((adr) => (
              <Badge key={adr} variant="outline" className="h-6 gap-1 text-[11px]">
                {adr}
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remove ADR ${adr}`}
                  onClick={() => updateAdrs(adrs.filter((value) => value !== adr))}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {adrInputOpen ? (
              <div className="flex min-w-[220px] flex-1 items-center gap-1">
                <AutocompleteInput
                  value={adrInput}
                  options={availableAdrOptions}
                  className="h-6 w-full"
                  autoFocus
                  placeholder="Add ADR"
                  noResultsText="No ADR suggestions."
                  onCommit={(value) => {
                    addAdr(value);
                    setAdrInputOpen(false);
                  }}
                  onValueChange={setAdrInput}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-xs"
                  className="h-6 w-6 shrink-0"
                  aria-label="Confirm add ADR"
                  disabled={!adrInput.trim()}
                  onClick={() => {
                    addAdr(adrInput);
                    setAdrInputOpen(false);
                  }}
                >
                  <Check className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="h-6 w-6 shrink-0"
                  aria-label="Cancel add ADR"
                  onClick={() => {
                    setAdrInput('');
                    setAdrInputOpen(false);
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
                aria-label="Add ADR"
                onClick={() => {
                  setAdrInput('');
                  setAdrInputOpen(true);
                }}
              >
                <Plus className="size-3" />
              </Button>
            )}
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
