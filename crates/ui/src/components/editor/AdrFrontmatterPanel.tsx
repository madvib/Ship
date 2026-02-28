import { useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { ADR } from '@/bindings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import DatePicker from '@/components/ui/date-picker';
import AutocompleteInput from '@/components/ui/autocomplete-input';

const ADR_STATUSES = ['proposed', 'accepted', 'rejected', 'superseded', 'deprecated'];

interface AdrFrontmatterPanelProps {
  adr: ADR;
  specSuggestions: string[];
  tagSuggestions: string[];
  onChange: (next: ADR) => void;
}

export default function AdrFrontmatterPanel({
  adr,
  specSuggestions,
  tagSuggestions,
  onChange,
}: AdrFrontmatterPanelProps) {
  const [tagInput, setTagInput] = useState('');
  const [tagInputOpen, setTagInputOpen] = useState(false);

  const statusOptions = useMemo(() => {
    const current = adr.metadata.status;
    if (!current || ADR_STATUSES.includes(current)) return ADR_STATUSES;
    return [current, ...ADR_STATUSES];
  }, [adr.metadata.status]);

  const updateMetadata = (patch: Partial<ADR['metadata']>) => {
    onChange({
      ...adr,
      metadata: {
        ...adr.metadata,
        ...patch,
      },
    });
  };

  const addTag = (valueOverride?: string) => {
    const cleaned = (valueOverride ?? tagInput).trim();
    if (!cleaned || (adr.metadata.tags ?? []).includes(cleaned)) return;
    updateMetadata({ tags: [...(adr.metadata.tags ?? []), cleaned] });
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    updateMetadata({ tags: (adr.metadata.tags ?? []).filter((value) => value !== tag) });
  };

  const availableTagOptions = tagSuggestions
    .filter((tag) => !(adr.metadata.tags ?? []).includes(tag))
    .map((tag) => ({ value: tag }));

  return (
    <section className="rounded-md border bg-card px-2.5 py-2">
      <div className="grid gap-x-2 gap-y-1.5 md:grid-cols-2">
        <div className="space-y-0.5">
          <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Status</label>
          <AutocompleteInput
            value={adr.metadata.status}
            options={statusOptions.map((value) => ({ value }))}
            placeholder="Status"
            className="h-8"
            noResultsText="No status matches."
            onValueChange={(status) => updateMetadata({ status: status.trim() || 'proposed' })}
          />
        </div>

        <div className="space-y-0.5">
          <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Date</label>
          <DatePicker
            value={adr.metadata.date}
            className="w-full"
            onValueChange={(date) => updateMetadata({ date })}
          />
        </div>

        <div className="space-y-0.5">
          <label className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Reference</label>
          <AutocompleteInput
            value={adr.metadata.spec ?? ''}
            options={specSuggestions.map((spec) => ({ value: spec }))}
            className="h-8"
            placeholder="Link related doc"
            noResultsText="No references found."
            onValueChange={(spec) => updateMetadata({ spec: spec.trim() ? spec.trim() : null })}
          />
        </div>

        <div className="space-y-0.5">
          <label className="text-muted-foreground mb-0.5 block text-xs font-medium uppercase tracking-wide">
            Tags {(adr.metadata.tags ?? []).length ? `(${(adr.metadata.tags ?? []).length})` : ''}
          </label>
          <div className="border-input bg-background/50 flex min-h-8 flex-wrap items-center gap-1.5 rounded-md border px-1.5 py-1">
            {(adr.metadata.tags ?? []).map((tag) => (
              <Badge key={tag} variant="outline" className="h-6 gap-1 text-[11px]">
                {tag}
                <button
                  type="button"
                  className="rounded-full p-0.5 hover:bg-muted"
                  aria-label={`Remove tag ${tag}`}
                  onClick={() => removeTag(tag)}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}

            {tagInputOpen ? (
              <div className="flex min-w-[200px] flex-1 items-center gap-1">
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
