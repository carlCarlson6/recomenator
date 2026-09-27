import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createUseCases } from '#/composition.js';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';

const markGroupAsReadSchema = z.object({ groupId: z.string().min(1) });

export const markGroupAsReadFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(markGroupAsReadSchema)
  .handler(async ({ data, context }) => {
    const { markGroupAsRead } = createUseCases();
    await markGroupAsRead({ userId: context.userId, groupId: data.groupId });
  });
