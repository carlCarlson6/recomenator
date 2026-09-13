import { describe, expect, it } from 'vitest';

import { createId } from '../../src/shared/kernel/idGenerator.js';

describe('createId', () => {
  it('returns a string starting with the given prefix', () => {
    const id = createId('grp');
    expect(id.startsWith('grp_')).toBe(true);
  });

  it('returns unique values', () => {
    const ids = new Set(Array.from({ length: 100 }, () => createId('tst')));
    expect(ids.size).toBe(100);
  });
});
