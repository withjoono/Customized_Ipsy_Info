import { createRouter } from '@tanstack/react-router';
import { rootRoute } from './routes/root';
import { feedRoute } from './routes/feed';
import { authCallbackRoute } from './routes/auth-callback';
import { adminRoute } from './routes/admin';
import { subscribeRoute } from './routes/subscribe';

const routeTree = rootRoute.addChildren([
  feedRoute,
  authCallbackRoute,
  adminRoute,
  subscribeRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
