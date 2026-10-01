import { createId } from '#/shared/kernel/idGenerator.js';
import { err, ok, type Result } from '#/shared/kernel/Result.js';
import type { DomainError } from '#/shared/kernel/DomainError.js';

import {
  avatarExtension,
  isAvatarContentType,
  MAX_AVATAR_BYTES,
  type AvatarContentType,
} from '../domain/avatarRules.js';
import {
  AvatarStorageError,
  AvatarUploadVerificationError,
  NotGroupMemberError,
  UnsupportedAvatarTypeError,
} from '../domain/errors.js';
import type { AvatarObject, AvatarStorage } from '../domain/ports/AvatarStorage.js';
import type { MembershipRepository } from '../domain/ports/MembershipRepository.js';

const UPLOAD_URL_EXPIRES_IN_SECONDS = 300;

export type AvatarUploadTicket = {
  uploadUrl: string;
  objectKey: string;
  publicUrl: string;
  contentType: AvatarContentType;
  expiresInSeconds: number;
};

type AvatarUseCaseDeps = {
  membershipRepo: MembershipRepository;
  avatarStorage: AvatarStorage;
};

async function deleteQuietly(storage: AvatarStorage, key: string): Promise<void> {
  try {
    await storage.delete(key);
  } catch {
    // Cleanup is best-effort: a leftover object must never fail the command.
  }
}

export async function createAvatarUploadUrl(
  input: { groupId: string; userId: string; contentType: string },
  deps: AvatarUseCaseDeps,
): Promise<Result<AvatarUploadTicket, DomainError>> {
  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, input.groupId);
  if (!membership) return err(new NotGroupMemberError());

  if (!isAvatarContentType(input.contentType)) return err(new UnsupportedAvatarTypeError());

  const objectKey = `avatars/${membership.id}/${createId('avt')}.${avatarExtension(input.contentType)}`;

  try {
    const uploadUrl = await deps.avatarStorage.createUploadUrl({
      key: objectKey,
      contentType: input.contentType,
      expiresInSeconds: UPLOAD_URL_EXPIRES_IN_SECONDS,
    });
    return ok({
      uploadUrl,
      objectKey,
      publicUrl: deps.avatarStorage.publicUrl(objectKey),
      contentType: input.contentType,
      expiresInSeconds: UPLOAD_URL_EXPIRES_IN_SECONDS,
    });
  } catch {
    return err(new AvatarStorageError('Could not prepare the avatar upload'));
  }
}

export async function confirmAvatarUpload(
  input: { groupId: string; userId: string; objectKey: string },
  deps: AvatarUseCaseDeps,
): Promise<Result<{ avatarUrl: string; previousAvatarUrl: string | null }, DomainError>> {
  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, input.groupId);
  if (!membership) return err(new NotGroupMemberError());

  const objectPrefix = `avatars/${membership.id}/`;
  if (!input.objectKey.startsWith(objectPrefix)) {
    return err(new AvatarUploadVerificationError('This uploaded avatar does not belong to you'));
  }

  let object: AvatarObject | null;
  try {
    object = await deps.avatarStorage.head(input.objectKey);
  } catch {
    return err(new AvatarStorageError('Could not verify the avatar upload'));
  }
  if (!object) {
    return err(new AvatarUploadVerificationError('The uploaded avatar could not be found'));
  }

  if (!isAvatarContentType(object.contentType)) {
    await deleteQuietly(deps.avatarStorage, input.objectKey);
    return err(new UnsupportedAvatarTypeError());
  }
  if (object.contentLength > MAX_AVATAR_BYTES) {
    await deleteQuietly(deps.avatarStorage, input.objectKey);
    return err(new AvatarUploadVerificationError('The uploaded avatar is too large'));
  }

  const previousAvatarUrl = membership.avatarUrl;
  const avatarUrl = deps.avatarStorage.publicUrl(input.objectKey);
  const updated = membership.updateAvatarUrl(avatarUrl);
  if (!updated.ok) {
    await deleteQuietly(deps.avatarStorage, input.objectKey);
    return updated;
  }

  try {
    await deps.membershipRepo.save(updated.value);
  } catch {
    await deleteQuietly(deps.avatarStorage, input.objectKey);
    return err(new AvatarStorageError('Could not save the avatar'));
  }

  if (previousAvatarUrl && previousAvatarUrl !== avatarUrl) {
    const previousKey = deps.avatarStorage.keyFromPublicUrl(previousAvatarUrl);
    if (previousKey) await deleteQuietly(deps.avatarStorage, previousKey);
  }

  return ok({ avatarUrl, previousAvatarUrl });
}

export async function removeAvatar(
  input: { groupId: string; userId: string },
  deps: AvatarUseCaseDeps,
): Promise<Result<{ avatarUrl: null }, DomainError>> {
  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, input.groupId);
  if (!membership) return err(new NotGroupMemberError());
  if (!membership.avatarUrl) return ok({ avatarUrl: null });

  const updated = membership.updateAvatarUrl(null);
  if (!updated.ok) return updated;

  await deps.membershipRepo.save(updated.value);

  const previousKey = deps.avatarStorage.keyFromPublicUrl(membership.avatarUrl);
  if (previousKey) await deleteQuietly(deps.avatarStorage, previousKey);

  return ok({ avatarUrl: null });
}
