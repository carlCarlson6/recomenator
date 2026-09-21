import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createUseCases } from '#/composition.js';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { unwrapResult } from '#/shared/kernel/unwrapResult.js';

const addReplySchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1).max(1000).trim(),
  parentId: z.string().min(1).optional(),
});

export const addReplyFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(addReplySchema)
  .handler(async ({ data, context }) => {
    const { addReply } = createUseCases();
    return unwrapResult(
      await addReply({
        postId: data.postId,
        authorId: context.userId,
        content: data.content,
        parentId: data.parentId,
      }),
    );
  });

const listRepliesSchema = z.object({ postId: z.string().min(1) });

export const listRepliesFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(listRepliesSchema)
  .handler(async ({ data, context }) => {
    const { listReplies } = createUseCases();
    return unwrapResult(
      await listReplies({
        postId: data.postId,
        userId: context.userId,
      }),
    );
  });

const deleteReplySchema = z.object({ replyId: z.string().min(1) });

export const deleteReplyFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(deleteReplySchema)
  .handler(async ({ data, context }) => {
    const { deleteReply } = createUseCases();
    return unwrapResult(
      await deleteReply({
        replyId: data.replyId,
        userId: context.userId,
      }),
    );
  });
