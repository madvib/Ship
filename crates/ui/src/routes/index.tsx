import { Navigate, createRoute } from '@tanstack/react-router';
import { OVERVIEW_ROUTE } from '../lib/constants/routes';
import { rootRoute } from './__root';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to={OVERVIEW_ROUTE} />,
});
