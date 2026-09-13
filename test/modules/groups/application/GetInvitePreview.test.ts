import { describe, expect, it } from 'vitest';

import { Group } from '../../../../src/modules/groups/domain/Group.js';
import { Invite } from '../../../../src/modules/groups/domain/Invite.js';
import type { GroupRepository } from '../../../../src/modules/groups/domain/ports/GroupRepository.js';
import type { InviteRepository } from '../../../../src/modules/groups/domain/ports/InviteRepository.js';
import {
  getInvitePreview,
  type GetInvitePreviewInput,
} from '../../../../src/modules/groups/application/GetInvitePreview.js';

class InMemoryInviteRepository implements InviteRepository {
  private invites: Map<string, Invite> = new Map();

  async findByCode(code: string): Promise<Invite | null> {
    for (const invite of this.invites.values()) {
      if (invite.code === code) return invite;
    }
    return null;
  }

  add(invite: Invite): void {
    this.invites.set(invite.id, invite);
  }

  async save(): Promise<void> {}
}

class InMemoryGroupRepository implements GroupRepository {
  private groups: Map<string, Group> = new Map();

  async findById(id: string): Promise<Group | null> {
    return this.groups.get(id) ?? null;
  }

  add(group: Group): void {
    this.groups.set(group.id, group);
  }

  async save(): Promise<void> {}
}

function createDeps() {
  const inviteRepo = new InMemoryInviteRepository();
  const groupRepo = new InMemoryGroupRepository();
  return { inviteRepo, groupRepo };
}

async function execute(input: GetInvitePreviewInput, deps: ReturnType<typeof createDeps>) {
  return getInvitePreview(input, deps);
}

describe('GetInvitePreview', () => {
  it('returns group info for a valid invite', async () => {
    const deps = createDeps();
    const group = Group.create({ name: 'Movie Buffs', createdById: 'usr_1' });
    expect(group.ok).toBe(true);
    if (!group.ok) return;

    const invite = Invite.create({ groupId: group.value.id, createdById: 'usr_1' });
    deps.inviteRepo.add(invite);
    deps.groupRepo.add(group.value);

    const result = await execute({ code: invite.code }, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.groupId).toBe(group.value.id);
    expect(result.value.groupName).toBe('Movie Buffs');
  });

  it('returns InviteNotFoundError for an unknown code', async () => {
    const deps = createDeps();
    const result = await execute({ code: 'x'.repeat(32) }, deps);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('INVITE_NOT_FOUND');
  });

  it('returns ExpiredInviteError for an expired invite', async () => {
    const deps = createDeps();
    const group = Group.create({ name: 'Expired Group', createdById: 'usr_1' });
    expect(group.ok).toBe(true);
    if (!group.ok) return;

    const invite = Invite.reconstitute({
      id: 'inv_1',
      code: 'a'.repeat(32),
      groupId: group.value.id,
      expiresAt: new Date(Date.now() - 1000),
      usageCount: 0,
      maxUses: null,
      createdById: 'usr_1',
      createdAt: new Date(),
    });
    deps.inviteRepo.add(invite);
    deps.groupRepo.add(group.value);

    const result = await execute({ code: invite.code }, deps);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('EXPIRED_INVITE');
  });
});
