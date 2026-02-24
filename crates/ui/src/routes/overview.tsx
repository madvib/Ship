import { createRoute, useNavigate } from '@tanstack/react-router';
import ProjectOverview from '../components/ProjectOverview';
import { useWorkspace } from '../hooks/workspace/WorkspaceContext';
import { AppRoutePath } from '../lib/constants/routes';
import { rootRoute } from './__root';

function OverviewRouteComponent() {
  const workspace = useWorkspace();
  const navigate = useNavigate();

  if (!workspace.activeProject) {
    return null;
  }

  const handleNavigate = (to: AppRoutePath) => {
    void navigate({ to });
  };

  return (
    <ProjectOverview
      project={workspace.activeProject}
      issues={workspace.issues}
      specs={workspace.specs}
      adrs={workspace.adrs}
      logs={workspace.logEntries}
      statuses={workspace.statuses}
      onNavigate={handleNavigate}
    />
  );
}

export const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/overview',
  component: OverviewRouteComponent,
});
