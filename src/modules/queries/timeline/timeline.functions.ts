import { createServerFn } from '@tanstack/react-start';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { getTimeline } from './timelineQuery.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';

export const getTimelineFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async ({ context, data }) => {
    const { groupId, category } = data as unknown as { groupId: string; category?: Category };
    return getTimeline(groupId, context.userId, category);
  });
