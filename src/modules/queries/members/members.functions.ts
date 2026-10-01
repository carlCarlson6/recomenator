import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { listGroupMembers } from './membersQuery.js';

const schema = z.object({ groupId: z.string().min(1) });

export const listGroupMembersFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(schema)
  .handler(async ({ data, context }) => {
    return listGroupMembers(data.groupId, context.userId);
  });
