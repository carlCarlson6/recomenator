import { describe, expect, it, vi } from 'vitest';

import {
  resolveIdentities,
  type ClerkIdentity,
  type ClerkIdentityLookup,
} from '#/modules/queries/shared/userIdentity.js';

describe('resolveIdentities', () => {
  it('prefers the membership display name and avatar without asking Clerk', async () => {
    const lookup = vi.fn<ClerkIdentityLookup>(async () => new Map());

    const result = await resolveIdentities(
      [
        {
          userId: 'usr_1',
          displayName: 'Alice',
          email: 'alice@example.com',
          avatarUrl: 'https://storage.example.com/alice.webp',
        },
      ],
      lookup,
    );

    expect(result.get('usr_1')).toEqual({
      displayName: 'Alice',
      avatarUrl: 'https://storage.example.com/alice.webp',
    });
    expect(lookup).not.toHaveBeenCalled();
  });

  it('falls back to the Clerk username when there is no display name', async () => {
    const lookup = vi.fn<ClerkIdentityLookup>(
      async () => new Map<string, ClerkIdentity>([['usr_1', { name: 'clerk_alice' }]]),
    );

    const result = await resolveIdentities(
      [{ userId: 'usr_1', displayName: null, email: 'alice@example.com' }],
      lookup,
    );

    expect(result.get('usr_1')).toEqual({ displayName: 'clerk_alice', avatarUrl: null });
  });

  it('leaves the avatar null when the membership has none, without asking Clerk', async () => {
    const lookup = vi.fn<ClerkIdentityLookup>(async () => new Map());

    const result = await resolveIdentities(
      [{ userId: 'usr_1', displayName: 'Alice', email: 'alice@example.com' }],
      lookup,
    );

    expect(result.get('usr_1')).toEqual({ displayName: 'Alice', avatarUrl: null });
    expect(lookup).not.toHaveBeenCalled();
  });

  it('keeps the membership avatar without asking Clerk', async () => {
    const lookup = vi.fn<ClerkIdentityLookup>(async () => new Map());

    const result = await resolveIdentities(
      [{ userId: 'usr_1', displayName: 'Alice', avatarUrl: 'https://storage.example.com/alice.webp' }],
      lookup,
    );

    expect(result.get('usr_1')?.avatarUrl).toBe('https://storage.example.com/alice.webp');
    expect(lookup).not.toHaveBeenCalled();
  });

  it('falls back to the local email and no avatar when Clerk has no entry', async () => {
    const lookup = vi.fn<ClerkIdentityLookup>(async () => new Map());

    const result = await resolveIdentities(
      [{ userId: 'usr_1', displayName: '', email: 'alice@example.com' }],
      lookup,
    );

    expect(result.get('usr_1')).toEqual({
      displayName: 'alice@example.com',
      avatarUrl: null,
    });
  });

  it('falls back to Anonymous when nothing resolves', async () => {
    const lookup = vi.fn<ClerkIdentityLookup>(async () => new Map());

    const result = await resolveIdentities([{ userId: 'usr_1', displayName: null, email: null }], lookup);

    expect(result.get('usr_1')).toEqual({ displayName: 'Anonymous', avatarUrl: null });
  });

  it('only asks Clerk for the distinct users missing a name', async () => {
    const lookup = vi.fn<ClerkIdentityLookup>(async () => new Map());

    await resolveIdentities(
      [
        { userId: 'usr_1', displayName: 'Alice', email: null, avatarUrl: 'https://a.example.com/a.webp' },
        { userId: 'usr_2', displayName: null, email: 'b@example.com' },
        { userId: 'usr_2', displayName: null, email: 'b@example.com' },
        { userId: 'usr_3', displayName: null, email: null },
        { userId: 'usr_4', displayName: 'Dave', email: null },
      ],
      lookup,
    );

    expect(lookup).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledWith(['usr_2', 'usr_3']);
  });

  it('merges repeated users, preferring the first name and avatar found', async () => {
    const lookup = vi.fn<ClerkIdentityLookup>(async () => new Map());

    const result = await resolveIdentities(
      [
        { userId: 'usr_1', displayName: null, email: 'alice@example.com', avatarUrl: null },
        { userId: 'usr_1', displayName: 'Alice', email: null, avatarUrl: 'https://a.example.com/a.webp' },
      ],
      lookup,
    );

    expect(result.get('usr_1')).toEqual({
      displayName: 'Alice',
      avatarUrl: 'https://a.example.com/a.webp',
    });
  });
});
