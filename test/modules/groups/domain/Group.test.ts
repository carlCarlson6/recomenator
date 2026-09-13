import { describe, expect, it } from 'vitest';

import { Group } from '../../../../src/modules/groups/domain/Group.js';

describe('Group', () => {
  it('creates a group with a valid name', () => {
    const result = Group.create({ name: 'My Group', createdById: 'usr_1' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.name).toBe('My Group');
    expect(result.value.createdById).toBe('usr_1');
  });

  it('rejects an empty name', () => {
    const result = Group.create({ name: '   ', createdById: 'usr_1' });
    expect(result.ok).toBe(false);
  });

  it('rejects a name that is too long', () => {
    const result = Group.create({ name: 'a'.repeat(101), createdById: 'usr_1' });
    expect(result.ok).toBe(false);
  });
});
