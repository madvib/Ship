import { useMemo } from 'react';
import { FacetedFilter } from '@/components/ui/faceted-filter';
import { FieldLabel } from '@/components/ui/field-label';
import AutocompleteInput from '@/components/ui/autocomplete-input';
import { Input } from '@/components/ui/input';
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
  /** @deprecated tagSuggestions is no longer used - tags are managed via FacetedFilter */
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
  tagSuggestions,
  onChange,
}: SpecMetadataPanelProps) {
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

  const commit = (nextFrontmatter: string | null) => onChange(nextFrontmatter, currentDelimiter);

  const updateField = (key: string, value: string) => {
    commit(setFrontmatterStringField(effectiveFrontmatter, key, value, currentDelimiter));
  };

  const updateTags = (nextTags: string[]) => {
    commit(setFrontmatterStringListField(effectiveFrontmatter, 'tags', nextTags, currentDelimiter));
  };

  return (
    <section className="rounded-md border bg-card px-2.5 py-2">
      <div className="grid gap-x-2 gap-y-1.5 md:grid-cols-2">
        <div className="space-y-0.5">
          <FieldLabel>Title</FieldLabel>
          <Input
            value={title}
            className="h-8"
            placeholder="Spec title"
            onChange={(event) => updateField('title', event.target.value)}
          />
        </div>

        <div className="space-y-0.5">
          <FieldLabel>Status</FieldLabel>
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
          <FieldLabel>Author</FieldLabel>
          <Input
            value={author}
            className="h-8"
            placeholder="Author"
            onChange={(event) => updateField('author', event.target.value)}
          />
        </div>

        <div className="space-y-0.5 md:col-span-2">
          <FieldLabel>
            Tags {tags.length ? `(${tags.length})` : ''}
          </FieldLabel>
          <FacetedFilter
            title="Add tag"
            options={tagSuggestions?.map((tag) => ({ label: tag, value: tag })) ?? []}
            selectedValues={tags}
            onSelectionChange={updateTags}
            allowNew
            onAddNew={(tag) => updateTags([...tags, tag])}
          />
        </div>
        </div>
    </section>
  );
}
