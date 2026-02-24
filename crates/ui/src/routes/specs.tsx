import { createRoute } from '@tanstack/react-router';
import SpecsPage from '../components/SpecsPage';
import { useWorkspace } from '../hooks/workspace/WorkspaceContext';
import { rootRoute } from './__root';

function SpecsRouteComponent() {
  const workspace = useWorkspace();

  return (
    <SpecsPage
      specs={workspace.specs}
      onSelectSpec={workspace.handleSelectSpec}
      onCreateSpec={workspace.handleCreateSpec}
    />
  );
}

export const specsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/specs',
  component: SpecsRouteComponent,
});
