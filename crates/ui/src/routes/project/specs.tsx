import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import { useWorkspace, useShip } from '@/lib/hooks/workspace/WorkspaceContext';
import { FEATURES_ROUTE } from '@/lib/constants/routes';
import RouteFallback from '@/components/app/RouteFallback';

const SpecsPage = lazy(() => import('@/features/planning/specs/SpecsPage'));

function SpecsRouteComponent() {
  const workspace = useWorkspace();
  const ship = useShip();
  const navigate = useNavigate();

  return (
    <Suspense fallback={<RouteFallback label="Loading specs..." />}>
      <SpecsPage
        specs={ship.specs}
        features={ship.features}
        selectedSpec={ship.selectedSpec}
        onCloseSpecDetail={() => ship.setSelectedSpec(null)}
        onSaveSpec={ship.handleSaveSpec}
        onDeleteSpec={ship.handleDeleteSpec}
        onMoveSpec={ship.handleMoveSpec}
        onSelectFeatureFromSpec={(feature) => {
          ship.setSelectedSpec(null);
          void navigate({ to: FEATURES_ROUTE });
          void ship.handleSelectFeature(feature);
        }}
        onSelectSpec={ship.handleSelectSpec}
        onCreateSpec={ship.handleCreateSpec}
        tagSuggestions={ship.tagSuggestions}
        mcpEnabled={workspace.mcpEnabled}
      />
    </Suspense>
  );
}

export const Route = createFileRoute('/project/specs')({
  component: SpecsRouteComponent,
});
