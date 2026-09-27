import { createServerFn } from '@tanstack/react-start';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { getPostDetail } from './postDetailQuery.js';

export const getPostDetailFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async ({ context, data }) => {
    const { postId } = data as unknown as { postId: string };
    return getPostDetail(postId, context.userId);
  });
