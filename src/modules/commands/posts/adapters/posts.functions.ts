import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createUseCases } from '#/composition.js';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { unwrapResult } from '#/shared/kernel/unwrapResult.js';
import type { Category, ReactionType } from '#/shared/infrastructure/db/schema.js';

const reactionTypeSchema = z.enum(['interested', 'liked', 'not_liked', 'viewed']);

const createPostSchema = z.object({
  groupId: z.string().min(1),
  category: z.enum(['VIDEO_GAMES', 'MOVIES', 'SHOWS', 'MUSIC', 'BOOKS', 'MISC']),
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  externalUrl: z.string().url().optional(),
  rating: z.number().int().min(1).max(10).optional(),
  draftId: z.string().min(1).optional(),
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
        draftId: data.draftId,
      }),
    );
  });

const editPostSchema = z.object({
  postId: z.string().min(1),
  category: z.enum(['VIDEO_GAMES', 'MOVIES', 'SHOWS', 'MUSIC', 'BOOKS', 'MISC']),
  title: z.string().min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  externalUrl: z.string().url().optional(),
  rating: z.number().int().min(1).max(10).optional(),
});

export const editPostFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(editPostSchema)
  .handler(async ({ data, context }) => {
    const { editPost } = createUseCases();
    return unwrapResult(
      await editPost({
        postId: data.postId,
        userId: context.userId,
        category: data.category as Category,
        title: data.title,
        description: data.description,
        externalUrl: data.externalUrl,
        rating: data.rating,
      }),
    );
  });

const saveDraftSchema = z.object({
  draftId: z.string().min(1).optional(),
  groupId: z.string().min(1),
  category: z.enum(['VIDEO_GAMES', 'MOVIES', 'SHOWS', 'MUSIC', 'BOOKS', 'MISC']),
  title: z.string().max(200).trim().optional().or(z.literal('')),
  description: z.string().max(2000).trim().optional().or(z.literal('')),
  externalUrl: z.string().url().optional().or(z.literal('')),
  rating: z.number().int().min(1).max(10).optional(),
});

export const saveDraftFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(saveDraftSchema)
  .handler(async ({ data, context }) => {
    const { saveDraft } = createUseCases();
    return unwrapResult(
      await saveDraft({
        draftId: data.draftId,
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

const deleteDraftSchema = z.object({
  draftId: z.string().min(1),
});

export const deleteDraftFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(deleteDraftSchema)
  .handler(async ({ data, context }) => {
    const { deleteDraft } = createUseCases();
    return unwrapResult(
      await deleteDraft({
        draftId: data.draftId,
        authorId: context.userId,
      }),
    );
  });

const postIdSchema = z.object({ postId: z.string().min(1) });

export const deletePostFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(postIdSchema)
  .handler(async ({ data, context }) => {
    const { deletePost } = createUseCases();
    return unwrapResult(
      await deletePost({
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
