import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { getPostDetail } from './postDetailQuery.js';

const schema = z.object({ postId: z.string().min(1) });

export const getPostDetailFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(schema)
  .handler(async ({ context, data }) => {
    return getPostDetail(data.postId, context.userId);
  });
