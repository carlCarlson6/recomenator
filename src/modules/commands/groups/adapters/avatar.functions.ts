import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createUseCases } from '#/composition.js';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { unwrapResult } from '#/shared/kernel/unwrapResult.js';

const avatarContentTypeSchema = z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

const groupIdSchema = z.object({ groupId: z.string().min(1) });

export const createAvatarUploadUrlFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(groupIdSchema.extend({ contentType: avatarContentTypeSchema }))
  .handler(async ({ data, context }) => {
    const { createAvatarUploadUrl } = createUseCases();
    return unwrapResult(
      await createAvatarUploadUrl({
        groupId: data.groupId,
        userId: context.userId,
        contentType: data.contentType,
      }),
    );
  });

const confirmAvatarUploadSchema = groupIdSchema.extend({
  objectKey: z.string().min(1).max(300).startsWith('avatars/'),
});

export const confirmAvatarUploadFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(confirmAvatarUploadSchema)
  .handler(async ({ data, context }) => {
    const { confirmAvatarUpload } = createUseCases();
    return unwrapResult(
      await confirmAvatarUpload({
        groupId: data.groupId,
        userId: context.userId,
        objectKey: data.objectKey,
      }),
    );
  });

export const removeAvatarFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(groupIdSchema)
  .handler(async ({ data, context }) => {
    const { removeAvatar } = createUseCases();
    return unwrapResult(
      await removeAvatar({
        groupId: data.groupId,
        userId: context.userId,
      }),
    );
  });
