import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { getInvitePageData } from './inviteQuery.js';

const schema = z.object({ code: z.string().length(32) });

export const getInvitePageDataFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(schema)
  .handler(async ({ context, data }) => {
    return getInvitePageData(data.code, context.userId);
  });
