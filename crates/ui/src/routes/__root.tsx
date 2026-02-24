import { createRootRoute } from '@tanstack/react-router';
import App from '../App';
import { WorkspaceProvider } from '../hooks/workspace/WorkspaceContext';

function RootLayout() {
  return (
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>
  );
}

export const rootRoute = createRootRoute({
  component: RootLayout,
});
