import { describe, expect, it } from 'vitest';

import { Invite } from '#/modules/commands/groups/domain/Invite.js';

describe('Invite', () => {
  it('creates a valid invite without an expiry', () => {
    const invite = Invite.create({ groupId: 'grp_1', createdById: 'usr_1' });
    expect(invite.code).toHaveLength(32);
    expect(invite.expiresAt).toBeNull();
    expect(invite.validate().ok).toBe(true);
  });

  it('does not expire even when a stored expiry is in the past', () => {
    const invite = Invite.reconstitute({
      id: 'inv_1',
      code: 'code',
      groupId: 'grp_1',
      expiresAt: new Date(Date.now() - 1000),
      usageCount: 0,
      maxUses: null,
      createdById: 'usr_1',
      createdAt: new Date(),
    });
    expect(invite.validate().ok).toBe(true);
  });

  it('rejects an invite that reached max uses', () => {
    const invite = Invite.reconstitute({
      id: 'inv_1',
      code: 'code',
      groupId: 'grp_1',
      expiresAt: null,
      usageCount: 5,
      maxUses: 5,
      createdById: 'usr_1',
      createdAt: new Date(),
    });
    expect(invite.validate().ok).toBe(false);
  });
});
