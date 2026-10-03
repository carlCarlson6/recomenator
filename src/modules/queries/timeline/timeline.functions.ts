import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { getTimeline } from './timelineQuery.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';
import type { TimelineCursor } from './timelinePagination.js';

const cursorSchema = z.object({
  createdAt: z.string().min(1),
  id: z.string().min(1),
});

const schema = z.object({
  groupId: z.string().min(1),
  category: z.enum(['VIDEO_GAMES', 'MOVIES', 'SHOWS', 'MUSIC', 'BOOKS', 'MISC']).optional(),
  cursor: cursorSchema.optional(),
  limit: z.number().int().positive().max(100).optional(),
});

export const getTimelineFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(schema)
  .handler(async ({ context, data }) => {
    return getTimeline(
      data.groupId,
      context.userId,
      data.category as Category | undefined,
      data.cursor as TimelineCursor | undefined,
      data.limit,
    );
  });
