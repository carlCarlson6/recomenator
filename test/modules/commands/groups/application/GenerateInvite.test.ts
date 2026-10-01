import { describe, expect, it } from 'vitest';

import { generateInvite } from '#/modules/commands/groups/application/GenerateInvite.js';
import { Group } from '#/modules/commands/groups/domain/Group.js';
import { Invite } from '#/modules/commands/groups/domain/Invite.js';
import { Membership } from '#/modules/commands/groups/domain/Membership.js';
import type { GroupRepository } from '#/modules/commands/groups/domain/ports/GroupRepository.js';
import type { InviteRepository } from '#/modules/commands/groups/domain/ports/InviteRepository.js';
import type { MembershipRepository } from '#/modules/commands/groups/domain/ports/MembershipRepository.js';

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

class InMemoryInviteRepository implements InviteRepository {
  private invites: Map<string, Invite> = new Map();

  async findByCode(code: string): Promise<Invite | null> {
    for (const invite of this.invites.values()) {
      if (invite.code === code) return invite;
    }
    return null;
  }

  async findByGroupId(groupId: string): Promise<Invite | null> {
    for (const invite of this.invites.values()) {
      if (invite.groupId === groupId) return invite;
    }
    return null;
  }

  add(invite: Invite): void {
    this.invites.set(invite.id, invite);
  }

  async save(invite: Invite): Promise<void> {
    this.invites.set(invite.id, invite);
  }

  count(): number {
    return this.invites.size;
  }
}

class InMemoryMembershipRepository implements MembershipRepository {
  private memberships: Membership[] = [];

  async findByUserAndGroup(userId: string, groupId: string): Promise<Membership | null> {
    return this.memberships.find((m) => m.userId === userId && m.groupId === groupId) ?? null;
  }

  async save(membership: Membership): Promise<void> {
    this.memberships.push(membership);
  }

  add(membership: Membership): void {
    this.memberships.push(membership);
  }
}

function createDeps() {
  const groupRepo = new InMemoryGroupRepository();
  const inviteRepo = new InMemoryInviteRepository();
  const membershipRepo = new InMemoryMembershipRepository();
  return { groupRepo, inviteRepo, membershipRepo };
}

function createGroupWithMember(deps: ReturnType<typeof createDeps>) {
  const group = Group.create({ name: 'Movie Buffs', createdById: 'usr_owner' });
  if (!group.ok) throw new Error('Failed to create group');
  deps.groupRepo.add(group.value);

  const membership = Membership.create({
    userId: 'usr_member',
    groupId: group.value.id,
    displayName: 'Alice',
  });
  if (!membership.ok) throw new Error('Failed to create membership');
  deps.membershipRepo.add(membership.value);

  return group.value;
}

describe('GenerateInvite', () => {
  it('allows any group member to generate an invite', async () => {
    const deps = createDeps();
    const group = createGroupWithMember(deps);

    const result = await generateInvite({ groupId: group.id, userId: 'usr_member' }, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.groupId).toBe(group.id);
    expect(result.value.expiresAt).toBeNull();
    expect(deps.inviteRepo.count()).toBe(1);
  });

  it('rejects a user who is not a member of the group', async () => {
    const deps = createDeps();
    const group = createGroupWithMember(deps);

    const result = await generateInvite({ groupId: group.id, userId: 'usr_stranger' }, deps);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_GROUP_MEMBER');
    expect(deps.inviteRepo.count()).toBe(0);
  });

  it('returns the existing invite instead of creating a new one', async () => {
    const deps = createDeps();
    const group = createGroupWithMember(deps);

    const first = await generateInvite({ groupId: group.id, userId: 'usr_member' }, deps);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = await generateInvite({ groupId: group.id, userId: 'usr_member' }, deps);

    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.value.id).toBe(first.value.id);
    expect(second.value.code).toBe(first.value.code);
    expect(deps.inviteRepo.count()).toBe(1);
  });

  it('returns GroupNotFoundError for an unknown group', async () => {
    const deps = createDeps();

    const result = await generateInvite({ groupId: 'grp_missing', userId: 'usr_member' }, deps);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('GROUP_NOT_FOUND');
  });
});
