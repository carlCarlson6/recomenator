import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createUseCases } from '#/composition.js';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { getNotifications, getUnreadNotificationCount } from './notificationsQuery.js';

const schema = z.object({ groupId: z.string().min(1) });

export const getGroupNotificationsFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(schema)
  .handler(async ({ data, context }) => {
    const result = await getNotifications(data.groupId, context.userId);

    const { markNotificationsSeen } = createUseCases();
    await markNotificationsSeen({ userId: context.userId, groupId: data.groupId });

    return result;
  });

export const getUnreadNotificationCountFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(schema)
  .handler(async ({ data, context }) => {
    return getUnreadNotificationCount(data.groupId, context.userId);
  });
