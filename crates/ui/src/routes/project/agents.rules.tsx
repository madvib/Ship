import { createFileRoute } from '@tanstack/react-router';
import AgentsPanel from '@/features/agents/AgentsPanel';
import { useWorkspace } from '@/lib/hooks/workspace/WorkspaceContext';

function AgentsRulesRouteComponent() {
  const workspace = useWorkspace();

  return (
    <AgentsPanel
      projectConfig={workspace.projectConfig}
      globalAgentConfig={workspace.globalAgentConfig}
      onSaveProject={workspace.handleSaveProjectSettings}
      onSaveGlobalAgentConfig={workspace.handleSaveGlobalAgentSettings}
      initialSection="rules"
    />
  );
}

export const Route = createFileRoute('/project/agents/rules')({
  component: AgentsRulesRouteComponent,
});
