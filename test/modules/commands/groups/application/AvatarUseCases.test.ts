import { describe, expect, it } from 'vitest';

import {
  confirmAvatarUpload,
  createAvatarUploadUrl,
  removeAvatar,
} from '#/modules/commands/groups/application/AvatarUseCases.js';
import { MAX_AVATAR_BYTES } from '#/modules/commands/groups/domain/avatarRules.js';
import { Membership } from '#/modules/commands/groups/domain/Membership.js';
import type { AvatarObject, AvatarStorage } from '#/modules/commands/groups/domain/ports/AvatarStorage.js';
import type { MembershipRepository } from '#/modules/commands/groups/domain/ports/MembershipRepository.js';

class InMemoryMembershipRepository implements MembershipRepository {
  private memberships: Membership[] = [];
  failOnSave = false;

  async findByUserAndGroup(userId: string, groupId: string): Promise<Membership | null> {
    return this.memberships.find((m) => m.userId === userId && m.groupId === groupId) ?? null;
  }

  async save(membership: Membership): Promise<void> {
    if (this.failOnSave) throw new Error('save failed');
    const index = this.memberships.findIndex((m) => m.id === membership.id);
    if (index >= 0) this.memberships[index] = membership;
    else this.memberships.push(membership);
  }

  add(membership: Membership): void {
    this.memberships.push(membership);
  }
}

class InMemoryAvatarStorage implements AvatarStorage {
  readonly bucketBaseUrl = 'https://storage.example.com/avatar-bucket';
  readonly objects = new Map<string, AvatarObject>();
  readonly deletedKeys: string[] = [];
  readonly presigned: Array<{ key: string; contentType: string; expiresInSeconds: number }> = [];
  failOnPresign = false;
  failOnHead = false;
  failOnDelete = false;

  async createUploadUrl(input: {
    key: string;
    contentType: string;
    expiresInSeconds: number;
  }): Promise<string> {
    if (this.failOnPresign) throw new Error('presign failed');
    this.presigned.push(input);
    return `https://signed.example.com/${input.key}?sig=1`;
  }

  async head(key: string): Promise<AvatarObject | null> {
    if (this.failOnHead) throw new Error('head failed');
    return this.objects.get(key) ?? null;
  }

  async delete(key: string): Promise<void> {
    if (this.failOnDelete) throw new Error('delete failed');
    this.deletedKeys.push(key);
    this.objects.delete(key);
  }

  publicUrl(key: string): string {
    return `${this.bucketBaseUrl}/${key}`;
  }

  keyFromPublicUrl(url: string): string | null {
    const prefix = `${this.bucketBaseUrl}/`;
    return url.startsWith(prefix) ? url.slice(prefix.length) : null;
  }

  put(key: string, object: AvatarObject): void {
    this.objects.set(key, object);
  }
}

const GROUP_ID = 'grp_1';
const USER_ID = 'usr_1';

function createDeps() {
  const membershipRepo = new InMemoryMembershipRepository();
  const avatarStorage = new InMemoryAvatarStorage();
  return { membershipRepo, avatarStorage };
}

function createMembership(overrides?: { userId?: string; groupId?: string }) {
  const membership = Membership.create({
    userId: overrides?.userId ?? USER_ID,
    groupId: overrides?.groupId ?? GROUP_ID,
    displayName: 'Alice',
  });
  expect(membership.ok).toBe(true);
  if (!membership.ok) throw new Error('Failed to create membership');
  return membership.value;
}

describe('AvatarUseCases', () => {
  describe('createAvatarUploadUrl', () => {
    it('rejects users who are not members of the group', async () => {
      const deps = createDeps();

      const result = await createAvatarUploadUrl(
        { groupId: GROUP_ID, userId: USER_ID, contentType: 'image/webp' },
        deps,
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('NOT_GROUP_MEMBER');
      expect(deps.avatarStorage.presigned).toHaveLength(0);
    });

    it('rejects unsupported content types without presigning', async () => {
      const deps = createDeps();
      deps.membershipRepo.add(createMembership());

      const result = await createAvatarUploadUrl(
        { groupId: GROUP_ID, userId: USER_ID, contentType: 'image/gif' },
        deps,
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('UNSUPPORTED_AVATAR_TYPE');
      expect(deps.avatarStorage.presigned).toHaveLength(0);
    });

    it('returns a presigned url scoped to the membership', async () => {
      const deps = createDeps();
      const membership = createMembership();
      deps.membershipRepo.add(membership);

      const result = await createAvatarUploadUrl(
        { groupId: GROUP_ID, userId: USER_ID, contentType: 'image/webp' },
        deps,
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.objectKey.startsWith(`avatars/${membership.id}/`)).toBe(true);
      expect(result.value.objectKey.endsWith('.webp')).toBe(true);
      expect(result.value.uploadUrl).toContain(result.value.objectKey);
      expect(result.value.publicUrl).toBe(`https://storage.example.com/avatar-bucket/${result.value.objectKey}`);
      expect(result.value.contentType).toBe('image/webp');
      expect(deps.avatarStorage.presigned).toEqual([
        { key: result.value.objectKey, contentType: 'image/webp', expiresInSeconds: 300 },
      ]);
    });

    it('returns a storage error when presigning fails', async () => {
      const deps = createDeps();
      deps.membershipRepo.add(createMembership());
      deps.avatarStorage.failOnPresign = true;

      const result = await createAvatarUploadUrl(
        { groupId: GROUP_ID, userId: USER_ID, contentType: 'image/png' },
        deps,
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('AVATAR_STORAGE_ERROR');
    });
  });

  describe('confirmAvatarUpload', () => {
    it('rejects users who are not members of the group', async () => {
      const deps = createDeps();

      const result = await confirmAvatarUpload(
        { groupId: GROUP_ID, userId: USER_ID, objectKey: 'avatars/mem_1/a.webp' },
        deps,
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('NOT_GROUP_MEMBER');
    });

    it('rejects object keys that belong to another membership without touching storage', async () => {
      const deps = createDeps();
      deps.membershipRepo.add(createMembership());

      const result = await confirmAvatarUpload(
        { groupId: GROUP_ID, userId: USER_ID, objectKey: 'avatars/mem_other/a.webp' },
        deps,
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('AVATAR_UPLOAD_VERIFICATION_FAILED');
      expect(deps.avatarStorage.deletedKeys).toHaveLength(0);
    });

    it('rejects keys that were never uploaded', async () => {
      const deps = createDeps();
      const membership = createMembership();
      deps.membershipRepo.add(membership);

      const result = await confirmAvatarUpload(
        { groupId: GROUP_ID, userId: USER_ID, objectKey: `avatars/${membership.id}/missing.webp` },
        deps,
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('AVATAR_UPLOAD_VERIFICATION_FAILED');
    });

    it('deletes the object and rejects a disallowed stored content type', async () => {
      const deps = createDeps();
      const membership = createMembership();
      deps.membershipRepo.add(membership);
      const key = `avatars/${membership.id}/a.webp`;
      deps.avatarStorage.put(key, { contentType: 'text/html', contentLength: 100 });

      const result = await confirmAvatarUpload(
        { groupId: GROUP_ID, userId: USER_ID, objectKey: key },
        deps,
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('UNSUPPORTED_AVATAR_TYPE');
      expect(deps.avatarStorage.deletedKeys).toEqual([key]);
    });

    it('deletes the object and rejects oversized uploads', async () => {
      const deps = createDeps();
      const membership = createMembership();
      deps.membershipRepo.add(membership);
      const key = `avatars/${membership.id}/a.webp`;
      deps.avatarStorage.put(key, { contentType: 'image/webp', contentLength: MAX_AVATAR_BYTES + 1 });

      const result = await confirmAvatarUpload(
        { groupId: GROUP_ID, userId: USER_ID, objectKey: key },
        deps,
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('AVATAR_UPLOAD_VERIFICATION_FAILED');
      expect(deps.avatarStorage.deletedKeys).toEqual([key]);
    });

    it('accepts an object exactly at the size limit', async () => {
      const deps = createDeps();
      const membership = createMembership();
      deps.membershipRepo.add(membership);
      const key = `avatars/${membership.id}/a.webp`;
      deps.avatarStorage.put(key, { contentType: 'image/webp', contentLength: MAX_AVATAR_BYTES });

      const result = await confirmAvatarUpload(
        { groupId: GROUP_ID, userId: USER_ID, objectKey: key },
        deps,
      );

      expect(result.ok).toBe(true);
    });

    it('stores the public url on the membership', async () => {
      const deps = createDeps();
      const membership = createMembership();
      deps.membershipRepo.add(membership);
      const key = `avatars/${membership.id}/a.webp`;
      deps.avatarStorage.put(key, { contentType: 'image/webp', contentLength: 100 });

      const result = await confirmAvatarUpload(
        { groupId: GROUP_ID, userId: USER_ID, objectKey: key },
        deps,
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.avatarUrl).toBe(`https://storage.example.com/avatar-bucket/${key}`);
      expect(result.value.previousAvatarUrl).toBeNull();
      const stored = await deps.membershipRepo.findByUserAndGroup(USER_ID, GROUP_ID);
      expect(stored?.avatarUrl).toBe(result.value.avatarUrl);
    });

    it('deletes the previous object when replacing an avatar', async () => {
      const deps = createDeps();
      const membership = createMembership();
      deps.membershipRepo.add(membership);
      const firstKey = `avatars/${membership.id}/first.webp`;
      const secondKey = `avatars/${membership.id}/second.webp`;
      deps.avatarStorage.put(firstKey, { contentType: 'image/webp', contentLength: 100 });
      deps.avatarStorage.put(secondKey, { contentType: 'image/webp', contentLength: 100 });

      const first = await confirmAvatarUpload(
        { groupId: GROUP_ID, userId: USER_ID, objectKey: firstKey },
        deps,
      );
      expect(first.ok).toBe(true);

      const second = await confirmAvatarUpload(
        { groupId: GROUP_ID, userId: USER_ID, objectKey: secondKey },
        deps,
      );

      expect(second.ok).toBe(true);
      if (!second.ok) return;
      expect(second.value.previousAvatarUrl).toBe(
        `https://storage.example.com/avatar-bucket/${firstKey}`,
      );
      expect(deps.avatarStorage.deletedKeys).toContain(firstKey);
      const stored = await deps.membershipRepo.findByUserAndGroup(USER_ID, GROUP_ID);
      expect(stored?.avatarUrl).toBe(`https://storage.example.com/avatar-bucket/${secondKey}`);
    });

    it('still succeeds when cleaning up the previous object fails', async () => {
      const deps = createDeps();
      const membership = createMembership();
      deps.membershipRepo.add(membership);
      const firstKey = `avatars/${membership.id}/first.webp`;
      deps.avatarStorage.put(firstKey, { contentType: 'image/webp', contentLength: 100 });
      const first = await confirmAvatarUpload(
        { groupId: GROUP_ID, userId: USER_ID, objectKey: firstKey },
        deps,
      );
      expect(first.ok).toBe(true);

      const secondKey = `avatars/${membership.id}/second.webp`;
      deps.avatarStorage.put(secondKey, { contentType: 'image/webp', contentLength: 100 });
      deps.avatarStorage.failOnDelete = true;

      const second = await confirmAvatarUpload(
        { groupId: GROUP_ID, userId: USER_ID, objectKey: secondKey },
        deps,
      );

      expect(second.ok).toBe(true);
      if (!second.ok) return;
      const stored = await deps.membershipRepo.findByUserAndGroup(USER_ID, GROUP_ID);
      expect(stored?.avatarUrl).toBe(`https://storage.example.com/avatar-bucket/${secondKey}`);
    });

    it('returns a storage error when verifying fails without deleting the object', async () => {
      const deps = createDeps();
      const membership = createMembership();
      deps.membershipRepo.add(membership);
      deps.avatarStorage.failOnHead = true;

      const result = await confirmAvatarUpload(
        { groupId: GROUP_ID, userId: USER_ID, objectKey: `avatars/${membership.id}/a.webp` },
        deps,
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('AVATAR_STORAGE_ERROR');
      expect(deps.avatarStorage.deletedKeys).toHaveLength(0);
    });

    it('rolls back the uploaded object when saving fails', async () => {
      const deps = createDeps();
      const membership = createMembership();
      deps.membershipRepo.add(membership);
      deps.membershipRepo.failOnSave = true;
      const key = `avatars/${membership.id}/a.webp`;
      deps.avatarStorage.put(key, { contentType: 'image/webp', contentLength: 100 });

      const result = await confirmAvatarUpload(
        { groupId: GROUP_ID, userId: USER_ID, objectKey: key },
        deps,
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('AVATAR_STORAGE_ERROR');
      expect(deps.avatarStorage.deletedKeys).toEqual([key]);
    });
  });

  describe('removeAvatar', () => {
    it('rejects users who are not members of the group', async () => {
      const deps = createDeps();

      const result = await removeAvatar({ groupId: GROUP_ID, userId: USER_ID }, deps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('NOT_GROUP_MEMBER');
    });

    it('clears the avatar and deletes the stored object', async () => {
      const deps = createDeps();
      const membership = createMembership();
      deps.membershipRepo.add(membership);
      const key = `avatars/${membership.id}/a.webp`;
      deps.avatarStorage.put(key, { contentType: 'image/webp', contentLength: 100 });
      const confirmed = await confirmAvatarUpload(
        { groupId: GROUP_ID, userId: USER_ID, objectKey: key },
        deps,
      );
      expect(confirmed.ok).toBe(true);

      const result = await removeAvatar({ groupId: GROUP_ID, userId: USER_ID }, deps);

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.avatarUrl).toBeNull();
      expect(deps.avatarStorage.deletedKeys).toContain(key);
      const stored = await deps.membershipRepo.findByUserAndGroup(USER_ID, GROUP_ID);
      expect(stored?.avatarUrl).toBeNull();
    });

    it('only clears the membership when there is no custom avatar', async () => {
      const deps = createDeps();
      deps.membershipRepo.add(createMembership());

      const result = await removeAvatar({ groupId: GROUP_ID, userId: USER_ID }, deps);

      expect(result.ok).toBe(true);
      expect(deps.avatarStorage.deletedKeys).toHaveLength(0);
    });
  });
});
