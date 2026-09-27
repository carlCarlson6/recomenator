import { createServerFn } from '@tanstack/react-start';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { listDrafts } from './draftsQuery.js';

export const listDraftsFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async ({ context, data }) => {
    const { groupId } = data as unknown as { groupId: string };
    return listDrafts(context.userId, groupId);
  });
