import { createFileRoute, useNavigate } from '@tanstack/react-router';
import FeaturesPage from '@/features/planning/FeaturesPage';
import { useWorkspace } from '@/lib/hooks/workspace/WorkspaceContext';
import { RELEASES_ROUTE } from '@/lib/constants/routes';

function FeaturesRouteComponent() {
  const workspace = useWorkspace();
  const navigate = useNavigate();

  return (
    <FeaturesPage
      features={workspace.features}
      releases={workspace.releases}
      specs={workspace.specs}
      adrs={workspace.adrs}
      selectedFeature={workspace.selectedFeature}
      onCloseFeatureDetail={() => workspace.setSelectedFeature(null)}
      onSelectFeature={workspace.handleSelectFeature}
      onSelectReleaseFromFeature={(name) => {
        const release = workspace.releases.find(
          (entry) => entry.file_name === name || entry.version === name
        );
        if (!release) return;
        workspace.setSelectedFeature(null);
        void navigate({ to: RELEASES_ROUTE });
        void workspace.handleSelectRelease(release);
      }}
      onSelectSpecFromFeature={(name) => {
        const spec = workspace.specs.find((entry) => entry.file_name === name);
        if (!spec) return;
        workspace.setSelectedFeature(null);
        void workspace.handleSelectSpec(spec);
      }}
      onSaveFeature={workspace.handleSaveFeature}
      onCreateFeature={workspace.handleCreateFeature}
      tagSuggestions={workspace.tagSuggestions}
      mcpEnabled={workspace.mcpEnabled}
    />
  );
}

export const Route = createFileRoute('/project/features')({
  component: FeaturesRouteComponent,
});
