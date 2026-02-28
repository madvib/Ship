import { useMemo, useState } from 'react';
import { Compass, Plus } from 'lucide-react';
import { AdrEntry } from '@/bindings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageFrame, PageHeader } from '@/components/app/PageFrame';
import TemplateEditorButton from './TemplateEditorButton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { getAdrStatusClasses } from '@/lib/workspace-ui';

interface AdrListProps {
  adrs: AdrEntry[];
  onNewAdr: () => void;
  onSelectAdr: (entry: AdrEntry) => void;
}

type AdrSort = 'newest' | 'oldest' | 'status';
const ADR_SORT_OPTIONS: Array<{ value: AdrSort; label: string }> = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'status', label: 'Status' },
];

export default function AdrList({ adrs, onNewAdr, onSelectAdr }: AdrListProps) {
  const [sortBy, setSortBy] = useState<AdrSort>('newest');
  const [search, setSearch] = useState('');

  const sortedAdrs = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const next = adrs.filter((entry) => {
      if (!needle) return true;
      return (
        entry.adr.metadata.title.toLowerCase().includes(needle) ||
        entry.adr.metadata.status.toLowerCase().includes(needle) ||
        entry.file_name.toLowerCase().includes(needle)
      );
    });
    next.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.adr.metadata.date).getTime() - new Date(b.adr.metadata.date).getTime();
        case 'status':
          return a.adr.metadata.status.localeCompare(b.adr.metadata.status, undefined, {
            sensitivity: 'base',
          });
        case 'newest':
        default:
          return new Date(b.adr.metadata.date).getTime() - new Date(a.adr.metadata.date).getTime();
      }
    });
    return next;
  }, [adrs, search, sortBy]);

  const formatDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <PageFrame>
      <PageHeader
        title="Architecture Decisions"
        description={`${adrs.length} recorded decision${adrs.length !== 1 ? 's' : ''}`}
        actions={
          <div className="flex items-center gap-2">
            <TemplateEditorButton kind="adr" />
            <Button onClick={onNewAdr}>
              <Plus className="size-4" />
              New Decision
            </Button>
          </div>
        }
      />

      {adrs.length === 0 ? (
        <EmptyState
          icon={<Compass className="size-4" />}
          title="No decisions yet"
          description="Document your architecture decisions to keep the team aligned."
          action={
            <Button onClick={onNewAdr}>
              <Plus className="mr-2 size-4" />
              Record First Decision
            </Button>
          }
        />
      ) : (
        <Card size="sm">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm">Decision Register</CardTitle>
                <CardDescription>Title first, with date and status at a glance.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search decisions"
                  className="h-8 w-[220px]"
                />
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as AdrSort)}>
                  <SelectTrigger size="sm" className="w-[180px]">
                    <SelectValue>
                      {ADR_SORT_OPTIONS.find((option) => option.value === sortBy)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {ADR_SORT_OPTIONS.map((option) => (
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
            {sortedAdrs.map((entry) => (
              <div
                key={entry.path}
                className="hover:bg-muted/40 rounded-md border p-2.5 transition-colors"
                title={entry.path}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{entry.adr.metadata.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-muted-foreground text-xs">{formatDate(entry.adr.metadata.date)}</span>
                      <Badge
                        variant="outline"
                        className={`w-fit ${getAdrStatusClasses(entry.adr.metadata.status)}`}
                      >
                        {entry.adr.metadata.status}
                      </Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onSelectAdr(entry)}>
                    Open
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </PageFrame>
  );
}
