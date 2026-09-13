import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { createUseCases } from '#/composition.js';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';
import { unwrapResult } from '#/shared/kernel/unwrapResult.js';

const createGroupSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  ownerDisplayName: z.string().min(1).max(50).trim(),
});

export const createGroupFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(createGroupSchema)
  .handler(async ({ data, context }) => {
    const { createGroup } = createUseCases();
    return unwrapResult(
      await createGroup({
        name: data.name,
        ownerId: context.userId,
        ownerDisplayName: data.ownerDisplayName,
      }),
    );
  });

const groupIdSchema = z.object({ groupId: z.string().min(1) });

export const generateInviteFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(groupIdSchema)
  .handler(async ({ data, context }) => {
    const { generateInvite } = createUseCases();
    return unwrapResult(
      await generateInvite({
        groupId: data.groupId,
        userId: context.userId,
      }),
    );
  });

export const getGroupFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(groupIdSchema)
  .handler(async ({ data, context }) => {
    const { getGroup } = createUseCases();
    return unwrapResult(
      await getGroup({
        groupId: data.groupId,
        userId: context.userId,
      }),
    );
  });

export const listMyGroupsFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async ({ context }) => {
    const { listMyGroups } = createUseCases();
    return listMyGroups({ userId: context.userId });
  });

const updateDisplayNameSchema = z.object({
  groupId: z.string().min(1),
  displayName: z.string().min(1).max(50).trim(),
});

export const updateDisplayNameFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(updateDisplayNameSchema)
  .handler(async ({ data, context }) => {
    const { updateDisplayName } = createUseCases();
    return unwrapResult(
      await updateDisplayName({
        groupId: data.groupId,
        userId: context.userId,
        displayName: data.displayName,
      }),
    );
  });

const inviteCodeSchema = z.object({
  code: z.string().length(32),
});

export const getInvitePreviewFn = createServerFn({ method: 'GET' })
  .validator(inviteCodeSchema)
  .handler(async ({ data }) => {
    const { getInvitePreview } = createUseCases();
    return unwrapResult(await getInvitePreview({ code: data.code }));
  });

export const getMyMembershipForGroupFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .validator(groupIdSchema)
  .handler(async ({ data, context }) => {
    const { getMyMembershipForGroup } = createUseCases();
    return unwrapResult(
      await getMyMembershipForGroup({
        groupId: data.groupId,
        userId: context.userId,
      }),
    );
  });

const joinGroupSchema = z.object({
  code: z.string().length(32),
  displayName: z.string().min(1).max(50).trim(),
});

export const joinGroupFn = createServerFn({ method: 'POST' })
  .middleware([protectedMiddleware])
  .validator(joinGroupSchema)
  .handler(async ({ data, context }) => {
    const { joinGroupWithInvite } = createUseCases();
    return unwrapResult(
      await joinGroupWithInvite({
        code: data.code,
        userId: context.userId,
        displayName: data.displayName,
      }),
    );
  });
