import { createServerFn } from '@tanstack/react-start';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { getInvitePageData } from './inviteQuery.js';

export const getInvitePageDataFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async ({ context, data }) => {
    const { code } = data as unknown as { code: string };
    return getInvitePageData(code, context.userId);
  });
