import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { getTimeline } from './timelineQuery.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';

const schema = z.object({
  groupId: z.string().min(1),
  category: z.enum(['VIDEO_GAMES', 'MOVIES', 'SHOWS', 'MUSIC', 'BOOKS', 'MISC']).optional(),
});

export const getTimelineFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(schema)
  .handler(async ({ context, data }) => {
    return getTimeline(data.groupId, context.userId, data.category as Category | undefined);
  });
