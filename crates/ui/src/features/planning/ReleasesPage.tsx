import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowRight, PackagePlus, Plus } from 'lucide-react';
import { FeatureInfo as FeatureEntry, ReleaseInfo as ReleaseEntry } from '@/bindings';
import DetailSheet from './DetailSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import MarkdownEditor from '@/components/editor';
import { PageFrame, PageHeader } from '@/components/app/PageFrame';
import TemplateEditorButton from './TemplateEditorButton';
import ReleaseMetadataPanel from '@/components/editor/ReleaseMetadataPanel';
import { readFrontmatterStringField, splitFrontmatterDocument } from '@/components/editor/frontmatter';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface ReleasesPageProps {
  releases: ReleaseEntry[];
  features: FeatureEntry[];
  onSelectRelease: (entry: ReleaseEntry) => void;
  onCreateRelease: (version: string, content: string) => Promise<void>;
}

type ReleaseSort = 'newest' | 'oldest' | 'status';
const RELEASE_SORT_OPTIONS: Array<{ value: ReleaseSort; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'status', label: 'Status' },
];

export default function ReleasesPage({
  releases,
  features,
  onSelectRelease,
  onCreateRelease,
}: ReleasesPageProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [content, setContent] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<ReleaseSort>('newest');
  const [search, setSearch] = useState('');

  const createInitialReleaseDocument = () => {
    return `+++
version = "v0.1.0-alpha"
status = "planned"
supported = false
target_date = ""
tags = []
+++

## Goal


## Scope

- [ ]

## Included Features

- [ ]

## Notes
`;
  };

  const featureCountsByRelease = useMemo(() => {
    const counts = new Map<string, number>();
    for (const feature of features) {
      const key = feature.release?.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [features]);

  const sortedReleases = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const next = releases.filter((release) => {
      if (!needle) return true;
      return (
        release.version.toLowerCase().includes(needle) ||
        release.status.toLowerCase().includes(needle) ||
        release.file_name.toLowerCase().includes(needle)
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
  }, [releases, search, sortBy]);

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    const parsed = splitFrontmatterDocument(content);
    const cleanVersion = readFrontmatterStringField(parsed.frontmatter, 'version').trim();
    if (!cleanVersion) {
      setError('Version is required.');
      return;
    }
    try {
      setCreating(true);
      await onCreateRelease(cleanVersion, content);
      setCreateOpen(false);
      setContent(createInitialReleaseDocument());
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
        const form = document.getElementById('new-release-form') as HTMLFormElement | null;
        form?.requestSubmit();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [createOpen, creating]);

  useEffect(() => {
    if (createOpen) return;
    setContent(createInitialReleaseDocument());
  }, [createOpen]);

  return (
    <PageFrame>
      <PageHeader
        title="Releases"
        description="Anchor feature delivery in named milestones."
        actions={
          <div className="flex items-center gap-2">
            <TemplateEditorButton kind="release" />
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              New Release
            </Button>
          </div>
        }
      />

      {releases.length === 0 ? (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PackagePlus className="size-4" />
              No releases yet
            </CardTitle>
            <CardDescription>Create an alpha milestone and attach features as you ship.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" />
              Create First Release
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card size="sm">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm">Release Timeline</CardTitle>
                <CardDescription>
                  {releases.length} release{releases.length !== 1 ? 's' : ''} in this project
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search releases"
                  className="h-8 w-[220px]"
                />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as ReleaseSort)}>
                  <SelectTrigger size="sm" className="w-[180px]">
                    <SelectValue>
                      {RELEASE_SORT_OPTIONS.find((option) => option.value === sortBy)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {RELEASE_SORT_OPTIONS.map((option) => (
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
            {sortedReleases.map((release) => (
              <div
                key={release.path}
                className="hover:bg-muted/40 grid gap-2 rounded-md border p-3 transition-colors md:grid-cols-[1fr_auto] md:items-center"
                title={release.path}
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium">{release.version}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{release.status}</Badge>
                    <Badge variant="secondary">
                      {featureCountsByRelease.get(release.file_name) ?? 0} feature
                      {(featureCountsByRelease.get(release.file_name) ?? 0) === 1 ? '' : 's'}
                    </Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => onSelectRelease(release)}>
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
          label="New Release"
          title={<h2 className="text-xl font-semibold tracking-tight">Create Release</h2>}
          meta={
            <p className="text-muted-foreground text-xs">
              Use a stable identifier, for example <code>v0.1.0-alpha</code>.
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
              <Button type="submit" form="new-release-form" disabled={creating}>
                {creating ? 'Creating…' : 'Create Release'}
              </Button>
            </div>
          }
        >
          <form id="new-release-form" onSubmit={submitCreate} className="space-y-4">
            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <MarkdownEditor
              label="Release Notes"
              value={content}
              onChange={(next) => {
                setContent(next);
                setError(null);
              }}
              frontmatterPanel={({ frontmatter, delimiter, onChange }) => (
                <ReleaseMetadataPanel
                  frontmatter={frontmatter}
                  delimiter={delimiter}
                  defaultVersion="v0.1.0-alpha"
                  defaultStatus="planned"
                  tagSuggestions={[]}
                  onChange={onChange}
                />
              )}
              placeholder="# Release Goal"
              rows={22}
              defaultMode="doc"
            />
          </form>
        </DetailSheet>
      )}
    </PageFrame>
  );
}
