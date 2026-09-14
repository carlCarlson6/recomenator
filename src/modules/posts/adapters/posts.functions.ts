import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createUseCases } from '#/composition.js';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { unwrapResult } from '#/shared/kernel/unwrapResult.js';
import type { Category, ReactionType } from '#/shared/infrastructure/db/schema.js';

const categorySchema = z.enum(['VIDEO_GAMES', 'MOVIES', 'SHOWS', 'MUSIC', 'BOOKS', 'MISC']);
const reactionTypeSchema = z.enum(['interested', 'liked', 'not_liked', 'viewed']);

const createPostSchema = z.object({
  groupId: z.string().min(1),
  category: z.enum(['VIDEO_GAMES', 'MOVIES', 'SHOWS', 'MUSIC', 'BOOKS', 'MISC']),
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  externalUrl: z.string().url().optional(),
  rating: z.number().int().min(1).max(10).optional(),
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
        rating: data.rating,
      }),
    );
  });

const timelineSchema = z.object({
  groupId: z.string().min(1),
  category: categorySchema.optional(),
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

const myInteractionsSchema = z.object({
  groupId: z.string().min(1),
  categories: z.array(categorySchema).optional(),
  types: z.array(reactionTypeSchema).optional(),
});

export const listMyInteractionsFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(myInteractionsSchema)
  .handler(async ({ data, context }) => {
    const { listMyInteractions } = createUseCases();
    return unwrapResult(
      await listMyInteractions({
        groupId: data.groupId,
        userId: context.userId,
        categories: data.categories as Category[] | undefined,
        types: data.types as ReactionType[] | undefined,
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

const reactionSchema = z.object({
  postId: z.string().min(1),
  type: reactionTypeSchema,
});

export const addPostReactionFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(reactionSchema)
  .handler(async ({ data, context }) => {
    const { addPostReaction } = createUseCases();
    return unwrapResult(
      await addPostReaction({
        postId: data.postId,
        userId: context.userId,
        type: data.type as ReactionType,
      }),
    );
  });

export const removePostReactionFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(reactionSchema)
  .handler(async ({ data, context }) => {
    const { removePostReaction } = createUseCases();
    return unwrapResult(
      await removePostReaction({
        postId: data.postId,
        userId: context.userId,
        type: data.type as ReactionType,
      }),
    );
  });
