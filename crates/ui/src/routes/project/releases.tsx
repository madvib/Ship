import { createFileRoute, useNavigate } from '@tanstack/react-router';
import ReleasesPage from '@/features/planning/ReleasesPage';
import { useWorkspace } from '@/lib/hooks/workspace/WorkspaceContext';
import { FEATURES_ROUTE } from '@/lib/constants/routes';

function ReleasesRouteComponent() {
  const workspace = useWorkspace();
  const navigate = useNavigate();

  return (
    <ReleasesPage
      releases={workspace.releases}
      features={workspace.features}
      selectedRelease={workspace.selectedRelease}
      onCloseReleaseDetail={() => workspace.setSelectedRelease(null)}
      onSelectRelease={workspace.handleSelectRelease}
      onSelectFeatureFromRelease={(feature) => {
        workspace.setSelectedRelease(null);
        void navigate({ to: FEATURES_ROUTE });
        void workspace.handleSelectFeature(feature);
      }}
      onSaveRelease={workspace.handleSaveRelease}
      onCreateRelease={workspace.handleCreateRelease}
      mcpEnabled={workspace.mcpEnabled}
    />
  );
}

export const Route = createFileRoute('/project/releases')({
  component: ReleasesRouteComponent,
});
