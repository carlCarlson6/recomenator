import { createServerFn } from '@tanstack/react-start';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { listReactors } from './reactorsQuery.js';
import type { ReactionType } from '#/shared/infrastructure/db/schema.js';

export const listPostReactorsFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async ({ data }) => {
    const { postId, groupId, type } = data as unknown as {
      postId: string;
      groupId: string;
      type: ReactionType;
    };
    return listReactors(postId, groupId, type);
  });
