import { createFileRoute } from '@tanstack/react-router';
import AdrList from '@/features/planning/AdrList';
import { useWorkspace, useShip } from '@/lib/hooks/workspace/WorkspaceContext';

function AdrsRouteComponent() {
  const workspace = useWorkspace();
  const ship = useShip();

  return (
    <AdrList
      adrs={ship.adrs}
      selectedAdr={ship.selectedAdr}
      onCreateAdr={ship.handleCreateAdr}
      onSelectAdr={ship.handleSelectAdr}
      onMoveAdr={ship.handleMoveAdr}
      onSaveAdr={ship.handleSaveAdr}
      onDeleteAdr={ship.handleDeleteAdr}
      specSuggestions={ship.specSuggestions}
      tagSuggestions={ship.tagSuggestions}
      adrSuggestions={ship.adrSuggestions}
      mcpEnabled={workspace.mcpEnabled}
    />
  );
}

export const Route = createFileRoute('/project/adrs')({
  component: AdrsRouteComponent,
});
