import { createServerFn } from '@tanstack/react-start';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { getInteractions } from './interactionsQuery.js';
import type { Category, ReactionType } from '#/shared/infrastructure/db/schema.js';

export const getInteractionsFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async ({ context, data }) => {
    const { groupId, categories, types } = data as unknown as {
      groupId: string;
      categories?: Category[];
      types?: ReactionType[];
    };
    return getInteractions(groupId, context.userId, categories, types);
  });
