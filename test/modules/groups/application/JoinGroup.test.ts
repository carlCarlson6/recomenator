import { describe, expect, it } from 'vitest';

import { joinGroupWithInvite } from '../../../../src/modules/groups/application/JoinGroup.js';
import { Group } from '../../../../src/modules/groups/domain/Group.js';
import { Invite } from '../../../../src/modules/groups/domain/Invite.js';
import { Membership } from '../../../../src/modules/groups/domain/Membership.js';
import type { GroupRepository } from '../../../../src/modules/groups/domain/ports/GroupRepository.js';
import type { InviteRepository } from '../../../../src/modules/groups/domain/ports/InviteRepository.js';
import type { MembershipRepository } from '../../../../src/modules/groups/domain/ports/MembershipRepository.js';

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

  add(invite: Invite): void {
    this.invites.set(invite.id, invite);
  }

  async save(invite: Invite): Promise<void> {
    this.invites.set(invite.id, invite);
  }
}

class InMemoryMembershipRepository implements MembershipRepository {
  private memberships: Membership[] = [];

  async findByUserAndGroup(userId: string, groupId: string): Promise<Membership | null> {
    return this.memberships.find((m) => m.userId === userId && m.groupId === groupId) ?? null;
  }

  async findByUserId(): Promise<never[]> {
    return [];
  }

  async findByGroupId(): Promise<never[]> {
    return [];
  }

  async save(membership: Membership): Promise<void> {
    const index = this.memberships.findIndex((m) => m.id === membership.id);
    if (index >= 0) {
      this.memberships[index] = membership;
    } else {
      this.memberships.push(membership);
    }
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

describe('JoinGroup', () => {
  it('creates a membership for a new member', async () => {
    const deps = createDeps();
    const group = Group.create({ name: 'Movie Buffs', createdById: 'usr_1' });
    expect(group.ok).toBe(true);
    if (!group.ok) return;

    const invite = Invite.create({ groupId: group.value.id, createdById: 'usr_1' });
    deps.inviteRepo.add(invite);
    deps.groupRepo.add(group.value);

    const result = await joinGroupWithInvite(
      { code: invite.code, userId: 'usr_2', displayName: 'Alice' },
      deps,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.groupId).toBe(group.value.id);
    expect(result.value.userId).toBe('usr_2');
    expect(result.value.displayName).toBe('Alice');
    expect(result.value.role).toBe('member');

    const storedInvite = await deps.inviteRepo.findByCode(invite.code);
    expect(storedInvite?.usageCount).toBe(1);
  });

  it('returns the existing membership when the user is already a member', async () => {
    const deps = createDeps();
    const group = Group.create({ name: 'Movie Buffs', createdById: 'usr_1' });
    expect(group.ok).toBe(true);
    if (!group.ok) return;

    const invite = Invite.create({ groupId: group.value.id, createdById: 'usr_1' });
    deps.inviteRepo.add(invite);
    deps.groupRepo.add(group.value);

    const existing = Membership.create({
      userId: 'usr_2',
      groupId: group.value.id,
      displayName: 'Alice',
    });
    expect(existing.ok).toBe(true);
    if (!existing.ok) return;
    deps.membershipRepo.add(existing.value);

    const result = await joinGroupWithInvite(
      { code: invite.code, userId: 'usr_2', displayName: 'Bob' },
      deps,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBe(existing.value.id);
    expect(result.value.displayName).toBe('Alice');
  });

  it('returns ExpiredInviteError for an expired invite', async () => {
    const deps = createDeps();
    const group = Group.create({ name: 'Movie Buffs', createdById: 'usr_1' });
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

    const result = await joinGroupWithInvite(
      { code: invite.code, userId: 'usr_2', displayName: 'Alice' },
      deps,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('EXPIRED_INVITE');
  });
});
