import { describe, expect, it } from 'vitest';

import { Invite } from '../../../../src/modules/groups/domain/Invite.js';

describe('Invite', () => {
  it('creates a valid invite', () => {
    const invite = Invite.create({ groupId: 'grp_1', createdById: 'usr_1' });
    expect(invite.code).toHaveLength(32);
    expect(invite.validate().ok).toBe(true);
  });

  it('rejects an expired invite', () => {
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
    expect(invite.validate().ok).toBe(false);
  });

  it('rejects an invite that reached max uses', () => {
    const invite = Invite.reconstitute({
      id: 'inv_1',
      code: 'code',
      groupId: 'grp_1',
      expiresAt: new Date(Date.now() + 10000),
      usageCount: 5,
      maxUses: 5,
      createdById: 'usr_1',
      createdAt: new Date(),
    });
    expect(invite.validate().ok).toBe(false);
  });
});
