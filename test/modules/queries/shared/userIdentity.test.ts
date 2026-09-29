import { describe, expect, it, vi } from 'vitest';

import { resolveDisplayNames, type ClerkNameLookup } from '#/modules/queries/shared/userIdentity.js';

describe('resolveDisplayNames', () => {
  it('prefers the membership display name and does not look it up in Clerk', async () => {
    const lookup = vi.fn<ClerkNameLookup>(async () => new Map());

    const result = await resolveDisplayNames(
      [{ userId: 'usr_1', displayName: 'Alice', email: 'alice@example.com' }],
      lookup,
    );

    expect(result.get('usr_1')).toBe('Alice');
    expect(lookup).not.toHaveBeenCalled();
  });

  it('falls back to the Clerk username when there is no display name', async () => {
    const lookup = vi.fn<ClerkNameLookup>(
      async () => new Map([['usr_1', 'clerk_alice']]),
    );

    const result = await resolveDisplayNames(
      [{ userId: 'usr_1', displayName: null, email: 'alice@example.com' }],
      lookup,
    );

    expect(result.get('usr_1')).toBe('clerk_alice');
  });

  it('falls back to the local email when Clerk has no entry', async () => {
    const lookup = vi.fn<ClerkNameLookup>(async () => new Map());

    const result = await resolveDisplayNames(
      [{ userId: 'usr_1', displayName: '', email: 'alice@example.com' }],
      lookup,
    );

    expect(result.get('usr_1')).toBe('alice@example.com');
  });

  it('falls back to Anonymous when nothing resolves', async () => {
    const lookup = vi.fn<ClerkNameLookup>(async () => new Map());

    const result = await resolveDisplayNames(
      [{ userId: 'usr_1', displayName: null, email: null }],
      lookup,
    );

    expect(result.get('usr_1')).toBe('Anonymous');
  });

  it('only asks Clerk for the distinct users missing a display name', async () => {
    const lookup = vi.fn<ClerkNameLookup>(async () => new Map());

    await resolveDisplayNames(
      [
        { userId: 'usr_1', displayName: 'Alice', email: null },
        { userId: 'usr_2', displayName: null, email: 'b@example.com' },
        { userId: 'usr_2', displayName: null, email: 'b@example.com' },
        { userId: 'usr_3', displayName: null, email: null },
      ],
      lookup,
    );

    expect(lookup).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledWith(['usr_2', 'usr_3']);
  });
});
