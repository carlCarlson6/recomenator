import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  prioritizeLastVisited,
  readLastVisitedGroupId,
  rememberLastVisitedGroup,
} from '#/shared/browser/lastVisitedGroup.js';

function createStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));

  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
    clear: () => map.clear(),
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    get length() {
      return map.size;
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('prioritizeLastVisited', () => {
  const groups = [
    { id: 'grp_a', name: 'Alpha' },
    { id: 'grp_b', name: 'Beta' },
    { id: 'grp_c', name: 'Gamma' },
  ];

  it('moves the last visited group to the front', () => {
    const result = prioritizeLastVisited(groups, 'grp_c');

    expect(result.map((g) => g.id)).toEqual(['grp_c', 'grp_a', 'grp_b']);
  });

  it('keeps the original order when there is no last visited group', () => {
    const result = prioritizeLastVisited(groups, null);

    expect(result).toEqual(groups);
  });

  it('keeps the original order when the last visited group is not in the list', () => {
    const result = prioritizeLastVisited(groups, 'grp_missing');

    expect(result.map((g) => g.id)).toEqual(['grp_a', 'grp_b', 'grp_c']);
  });

  it('keeps the original order when the last visited group is already first', () => {
    const result = prioritizeLastVisited(groups, 'grp_a');

    expect(result.map((g) => g.id)).toEqual(['grp_a', 'grp_b', 'grp_c']);
  });

  it('does not mutate the input array', () => {
    prioritizeLastVisited(groups, 'grp_c');

    expect(groups.map((g) => g.id)).toEqual(['grp_a', 'grp_b', 'grp_c']);
  });
});

describe('readLastVisitedGroupId', () => {
  it('returns null when there is no storage (server-side)', () => {
    expect(readLastVisitedGroupId()).toBeNull();
  });

  it('returns null when nothing was stored', () => {
    vi.stubGlobal('window', { localStorage: createStorage() });

    expect(readLastVisitedGroupId()).toBeNull();
  });

  it('returns the stored group id', () => {
    vi.stubGlobal('window', {
      localStorage: createStorage({ 'recomenator.lastVisitedGroupId': 'grp_b' }),
    });

    expect(readLastVisitedGroupId()).toBe('grp_b');
  });

  it('returns null when storage throws', () => {
    vi.stubGlobal('window', {
      localStorage: {
        ...createStorage(),
        getItem: () => {
          throw new Error('denied');
        },
      },
    });

    expect(readLastVisitedGroupId()).toBeNull();
  });
});

describe('rememberLastVisitedGroup', () => {
  it('stores the group id', () => {
    const storage = createStorage();
    vi.stubGlobal('window', { localStorage: storage });

    rememberLastVisitedGroup('grp_c');

    expect(storage.getItem('recomenator.lastVisitedGroupId')).toBe('grp_c');
  });

  it('does not throw when storage is unavailable', () => {
    expect(() => rememberLastVisitedGroup('grp_c')).not.toThrow();
  });

  it('does not throw when storage throws', () => {
    vi.stubGlobal('window', {
      localStorage: {
        ...createStorage(),
        setItem: () => {
          throw new Error('denied');
        },
      },
    });

    expect(() => rememberLastVisitedGroup('grp_c')).not.toThrow();
  });
});
