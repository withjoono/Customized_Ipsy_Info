import { createRouter } from '@tanstack/react-router';
import { rootRoute } from './routes/root';
import { dashboardRoute } from './routes/dashboard';
import { calendarRoute } from './routes/calendar';
import { feedRoute } from './routes/feed';
import { scheduleRoute } from './routes/schedule';
import { authCallbackRoute } from './routes/auth-callback';
import { adminRoute } from './routes/admin';
import { subscribeRoute } from './routes/subscribe';
import { promoIndexRoute, promoGuideRoute, promoBlogRoute } from './routes/promo';

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  calendarRoute,
  feedRoute,
  scheduleRoute,
  authCallbackRoute,
  adminRoute,
  subscribeRoute,
  promoIndexRoute,
  promoGuideRoute,
  promoBlogRoute,
]);

export const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
