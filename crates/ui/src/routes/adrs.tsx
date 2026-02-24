import { createRoute } from '@tanstack/react-router';
import AdrList from '../components/AdrList';
import { useWorkspace } from '../hooks/workspace/WorkspaceContext';
import { rootRoute } from './__root';

function AdrsRouteComponent() {
  const workspace = useWorkspace();

  return (
    <AdrList
      adrs={workspace.adrs}
      onNewAdr={() => workspace.setShowNewAdr(true)}
      onSelectAdr={workspace.handleSelectAdr}
    />
  );
}

export const adrsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/adrs',
  component: AdrsRouteComponent,
});
