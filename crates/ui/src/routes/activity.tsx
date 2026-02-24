import { createRoute } from '@tanstack/react-router';
import { Clock3, RefreshCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { useWorkspace } from '../hooks/workspace/WorkspaceContext';
import { rootRoute } from './__root';

type ActivityKind = 'issue' | 'spec' | 'adr' | 'project' | 'settings' | 'system';

function classifyActivity(action: string): ActivityKind {
  const lower = action.toLowerCase();
  if (lower.includes('issue')) return 'issue';
  if (lower.includes('spec')) return 'spec';
  if (lower.includes('adr') || lower.includes('decision')) return 'adr';
  if (lower.includes('project')) return 'project';
  if (lower.includes('config') || lower.includes('setting')) return 'settings';
  return 'system';
}

const KIND_STYLES: Record<ActivityKind, string> = {
  issue: 'border-amber-500/30 text-amber-300',
  spec: 'border-sky-500/30 text-sky-300',
  adr: 'border-emerald-500/30 text-emerald-300',
  project: 'border-violet-500/30 text-violet-300',
  settings: 'border-fuchsia-500/30 text-fuchsia-300',
  system: 'border-zinc-500/30 text-zinc-300',
};

function ActivityRouteComponent() {
  const workspace = useWorkspace();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-5 md:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground text-sm">
            {workspace.activeProject?.name ?? 'Project'} · showing latest activity
          </p>
        </div>
        <Button variant="outline" onClick={workspace.refreshLog}>
          <RefreshCcw className="size-4" />
          Refresh
        </Button>
      </header>

      <Card size="sm">
        <CardContent className="space-y-3">
          {workspace.logEntries.length === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-6 text-center">
              <p className="text-muted-foreground text-sm">
                No activity yet. Start working on issues to see activity here.
              </p>
            </div>
          ) : (
            <div className="relative pl-5">
              <div className="bg-border absolute bottom-0 left-1 top-0 w-px" />
              <div className="space-y-3">
                {workspace.logEntries.map((entry, index) => {
                  const kind = classifyActivity(entry.action);
                  const actor = entry.actor?.trim() ? entry.actor.trim() : 'system';

                  return (
                    <article
                      key={`${entry.timestamp}-${index}`}
                      className="bg-card relative rounded-lg border px-3 py-2"
                    >
                      <span className="bg-primary absolute -left-[1.15rem] top-3 size-2.5 rounded-full border border-background" />
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">{entry.action}</div>
                          <div className="text-muted-foreground text-sm">{entry.details}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={KIND_STYLES[kind]}>
                            {kind}
                          </Badge>
                          <Badge variant="outline" className="text-muted-foreground">
                            {actor}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-muted-foreground mt-2 inline-flex items-center gap-1.5 text-xs">
                        <Clock3 className="size-3.5 text-violet-400" />
                        {new Date(entry.timestamp).toLocaleString()}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const activityRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/activity',
  component: ActivityRouteComponent,
});
