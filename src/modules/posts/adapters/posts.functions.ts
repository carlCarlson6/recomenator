import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createUseCases } from '#/composition.js';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { unwrapResult } from '#/shared/kernel/unwrapResult.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';

const createPostSchema = z.object({
  groupId: z.string().min(1),
  category: z.enum(['VIDEO_GAMES', 'MOVIES', 'SHOWS', 'MUSIC', 'MISC']),
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  externalUrl: z.string().url().optional(),
});

export const createPostFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(createPostSchema)
  .handler(async ({ data, context }) => {
    const { createPost } = createUseCases();
    return unwrapResult(
      await createPost({
        groupId: data.groupId,
        authorId: context.userId,
        category: data.category as Category,
        title: data.title,
        description: data.description,
        externalUrl: data.externalUrl,
      }),
    );
  });

const timelineSchema = z.object({
  groupId: z.string().min(1),
  category: z.enum(['VIDEO_GAMES', 'MOVIES', 'SHOWS', 'MUSIC', 'MISC']).optional(),
});

export const listTimelinePostsFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(timelineSchema)
  .handler(async ({ data, context }) => {
    const { listTimelinePosts } = createUseCases();
    return unwrapResult(
      await listTimelinePosts({
        groupId: data.groupId,
        userId: context.userId,
        category: data.category as Category | undefined,
      }),
    );
  });

const postIdSchema = z.object({ postId: z.string().min(1) });

export const getPostFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(postIdSchema)
  .handler(async ({ data, context }) => {
    const { getPost } = createUseCases();
    return unwrapResult(
      await getPost({
        postId: data.postId,
        userId: context.userId,
      }),
    );
  });
