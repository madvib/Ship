import { createFileRoute } from '@tanstack/react-router';
import SpecsPage from '@/features/planning/SpecsPage';
import { useShip } from '@/lib/hooks/workspace/WorkspaceContext';

function SpecsRouteComponent() {
  const ship = useShip();

  return (
    <SpecsPage
      specs={ship.specs}
      tagSuggestions={ship.tagSuggestions}
      onSelectSpec={ship.handleSelectSpec}
      onCreateSpec={ship.handleCreateSpec}
    />
  );
}

export const Route = createFileRoute('/project/specs')({
  component: SpecsRouteComponent,
});
