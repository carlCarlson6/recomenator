import { auth } from '@clerk/tanstack-react-start/server';
import { createMiddleware } from '@tanstack/react-start';
import { redirect } from '@tanstack/react-router';
import { getRequest } from '@tanstack/react-start/server';

function getRelativeRedirectUrl(fallback = '/'): string {
  const referer = getRequest().headers.get('referer');
  if (!referer) return fallback;
  try {
    const url = new URL(referer);
    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}

export const protectedMiddleware = createMiddleware().server(async ({ next }) => {
  const { userId } = await auth();
  if (!userId) {
    throw redirect({
      to: '/sign-in/$',
      search: { redirect_url: getRelativeRedirectUrl() },
    });
  }
  return next({ context: { userId } });
});
