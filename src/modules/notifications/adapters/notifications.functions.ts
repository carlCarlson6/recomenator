import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createUseCases } from '#/composition.js';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';

export const getUnreadGroupsFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async ({ context }) => {
    const { getUnreadGroups } = createUseCases();
    return getUnreadGroups({ userId: context.userId });
  });

const markGroupAsReadSchema = z.object({ groupId: z.string().min(1) });

export const markGroupAsReadFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(markGroupAsReadSchema)
  .handler(async ({ data, context }) => {
    const { markGroupAsRead } = createUseCases();
    await markGroupAsRead({ userId: context.userId, groupId: data.groupId });
  });
