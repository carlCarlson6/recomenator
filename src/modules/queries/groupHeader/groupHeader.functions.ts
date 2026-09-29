import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { getGroupHeader } from './groupHeaderQuery.js';

const schema = z.object({ groupId: z.string().min(1) });

export const getGroupFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(schema)
  .handler(async ({ data, context }) => {
    return getGroupHeader(data.groupId, context.userId);
  });
