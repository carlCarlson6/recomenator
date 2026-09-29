import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { getInteractions } from './interactionsQuery.js';
import type { Category, ReactionType } from '#/shared/infrastructure/db/schema.js';

const categorySchema = z.enum(['VIDEO_GAMES', 'MOVIES', 'SHOWS', 'MUSIC', 'BOOKS', 'MISC']);
const reactionTypeSchema = z.enum(['interested', 'liked', 'not_liked', 'viewed']);

const schema = z.object({
  groupId: z.string().min(1),
  categories: z.array(categorySchema).optional(),
  types: z.array(reactionTypeSchema).optional(),
});

export const getInteractionsFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(schema)
  .handler(async ({ context, data }) => {
    return getInteractions(
      data.groupId,
      context.userId,
      data.categories as Category[] | undefined,
      data.types as ReactionType[] | undefined,
    );
  });
