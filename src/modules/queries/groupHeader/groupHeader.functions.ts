import { createServerFn } from '@tanstack/react-start';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { getGroupHeader } from './groupHeaderQuery.js';

export const getGroupFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async ({ data }) => {
    const { groupId } = data as unknown as { groupId: string };
    return getGroupHeader(groupId);
  });
