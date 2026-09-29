import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { listDrafts } from './draftsQuery.js';

const schema = z.object({ groupId: z.string().min(1) });

export const listDraftsFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(schema)
  .handler(async ({ context, data }) => {
    return listDrafts(context.userId, data.groupId);
  });
