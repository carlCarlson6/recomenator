import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { listReactors } from './reactorsQuery.js';
import type { ReactionType } from '#/shared/infrastructure/db/schema.js';

const reactionTypeSchema = z.enum(['interested', 'liked', 'not_liked', 'viewed']);
const schema = z.object({ postId: z.string().min(1), type: reactionTypeSchema });

export const listPostReactorsFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(schema)
  .handler(async ({ context, data }) => {
    return listReactors(data.postId, context.userId, data.type as ReactionType);
  });
