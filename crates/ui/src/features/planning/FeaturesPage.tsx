import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, Flag, Plus } from 'lucide-react';
import { AdrEntry, FeatureInfo as FeatureEntry, ReleaseInfo as ReleaseEntry, SpecInfo as SpecEntry } from '@/bindings';
import DetailSheet from './DetailSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MarkdownEditor from '@/components/editor';
import { PageFrame, PageHeader } from '@/components/app/PageFrame';
import FeatureMetadataPanel from '@/components/editor/FeatureMetadataPanel';
import { readFrontmatterStringField, splitFrontmatterDocument } from '@/components/editor/frontmatter';
import TemplateEditorButton from './TemplateEditorButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface FeaturesPageProps {
  features: FeatureEntry[];
  releases: ReleaseEntry[];
  specs: SpecEntry[];
  adrs: AdrEntry[];
  onSelectFeature: (entry: FeatureEntry) => void;
  onCreateFeature: (
    title: string,
    content: string,
    release?: string | null,
    spec?: string | null
  ) => Promise<void>;
}

type FeatureSort = 'newest' | 'oldest' | 'status';
const FEATURE_SORT_OPTIONS: Array<{ value: FeatureSort; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'status', label: 'Status' },
];

export default function FeaturesPage({
  features,
  releases,
  specs,
  adrs,
  onSelectFeature,
  onCreateFeature,
}: FeaturesPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<FeatureSort>('newest');
  const [search, setSearch] = useState('');

  const sortedFeatures = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const next = features.filter((feature) => {
      if (!needle) return true;
      return (
        feature.title.toLowerCase().includes(needle) ||
        feature.status.toLowerCase().includes(needle) ||
        (feature.release ?? '').toLowerCase().includes(needle) ||
        feature.file_name.toLowerCase().includes(needle)
      );
    });
    next.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.updated).getTime() - new Date(b.updated).getTime();
        case 'status':
          return a.status.localeCompare(b.status, undefined, { sensitivity: 'base' });
        case 'newest':
        default:
          return new Date(b.updated).getTime() - new Date(a.updated).getTime();
      }
    });
    return next;
  }, [features, search, sortBy]);

  const createInitialFeatureDocument = () => {
    return `+++
title = ""
status = "active"
release = ""
spec = ""
adrs = []
tags = []
+++

## Why


## Acceptance Criteria

- [ ]

## Delivery Todos

- [ ]

## Notes
`;
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = splitFrontmatterDocument(content);
    const cleanTitle = readFrontmatterStringField(parsed.frontmatter, 'title').trim();
    if (!cleanTitle) {
      setError('Title is required.');
      return;
    }
    const release = readFrontmatterStringField(parsed.frontmatter, 'release').trim();
    const spec = readFrontmatterStringField(parsed.frontmatter, 'spec').trim();
    try {
      setCreating(true);
      await onCreateFeature(
        cleanTitle,
        content,
        release.trim() ? release.trim() : null,
        spec.trim() ? spec.trim() : null
      );
      setCreateOpen(false);
      setContent(createInitialFeatureDocument());
      setError(null);
    } catch (createError) {
      setError(String(createError));
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (!createOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !creating) {
        event.preventDefault();
        setCreateOpen(false);
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        const form = document.getElementById('new-feature-form') as HTMLFormElement | null;
        form?.requestSubmit();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [createOpen, creating]);

  useEffect(() => {
    if (createOpen) return;
    setContent(createInitialFeatureDocument());
  }, [createOpen]);

  return (
    <PageFrame>
      <PageHeader
        title="Features"
        description="Plan customer-visible slices and bind them to releases/specs."
        actions={
          <div className="flex items-center gap-2">
            <TemplateEditorButton kind="feature" />
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New Feature
            </Button>
          </div>
        }
      />

      {features.length === 0 ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="size-4" />
              No features yet
            </CardTitle>
            <CardDescription>Create feature docs and track their delivery by release.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create First Feature
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card size="sm">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm">Feature Inventory</CardTitle>
                <CardDescription>
                  {features.length} feature{features.length !== 1 ? 's' : ''} in this project
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search features"
                  className="h-8 w-[220px]"
                />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as FeatureSort)}>
                  <SelectTrigger size="sm" className="w-[180px]">
                    <SelectValue>
                      {FEATURE_SORT_OPTIONS.find((option) => option.value === sortBy)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {FEATURE_SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {sortedFeatures.map((feature) => (
              <div
                key={feature.path}
                className="hover:bg-muted/40 grid gap-2 rounded-md border p-3 transition-colors md:grid-cols-[1fr_auto] md:items-center"
                title={feature.path}
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">{feature.title}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{feature.status}</Badge>
                    {feature.release && <Badge variant="secondary">{feature.release}</Badge>}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => onSelectFeature(feature)}>
                  Open
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {createOpen && (
        <DetailSheet
          label="New Feature"
          title={<h2 className="text-xl font-semibold tracking-tight">Create Feature</h2>}
          meta={
            <p className="text-muted-foreground text-xs">
              Add optional links to a release and a spec.
            </p>
          }
          onClose={() => {
            if (creating) return;
            setCreateOpen(false);
          }}
          className="max-w-[1400px]"
          footer={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button type="submit" form="new-feature-form" disabled={creating}>
                {creating ? 'Creating…' : 'Create Feature'}
              </Button>
            </div>
          }
        >
          <form id="new-feature-form" onSubmit={submitCreate} className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <MarkdownEditor
              label="Feature Plan"
              value={content}
              onChange={(next) => {
                setContent(next);
                setError(null);
              }}
              frontmatterPanel={({ frontmatter, delimiter, onChange }) => (
                <FeatureMetadataPanel
                  frontmatter={frontmatter}
                  delimiter={delimiter}
                  defaultTitle=""
                  defaultStatus="active"
                  releaseSuggestions={releases.map((entry) => entry.file_name)}
                  specSuggestions={specs.map((entry) => entry.file_name)}
                  adrSuggestions={adrs.map((entry) => entry.file_name)}
                  tagSuggestions={[]}
                  onChange={onChange}
                />
              )}
              placeholder="# Why this feature"
              rows={22}
              defaultMode="doc"
            />
          </form>
        </DetailSheet>
      )}
    </PageFrame>
  );
}
