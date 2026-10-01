import { describe, expect, it } from 'vitest';

import { Membership } from '#/modules/commands/groups/domain/Membership.js';

function createMembership() {
  const membership = Membership.create({
    userId: 'usr_1',
    groupId: 'grp_1',
    displayName: 'Alice',
  });
  expect(membership.ok).toBe(true);
  if (!membership.ok) throw new Error('Failed to create membership');
  return membership.value;
}

describe('Membership avatars', () => {
  it('starts without an avatar', () => {
    expect(createMembership().avatarUrl).toBeNull();
  });

  it('sets a valid avatar url without mutating the original', () => {
    const membership = createMembership();

    const result = membership.updateAvatarUrl('https://storage.example.com/avatars/mem_1/a.webp');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.avatarUrl).toBe('https://storage.example.com/avatars/mem_1/a.webp');
    expect(membership.avatarUrl).toBeNull();
  });

  it('clears the avatar url with null', () => {
    const withAvatar = createMembership().updateAvatarUrl('https://example.com/a.webp');
    expect(withAvatar.ok).toBe(true);
    if (!withAvatar.ok) return;

    const cleared = withAvatar.value.updateAvatarUrl(null);

    expect(cleared.ok).toBe(true);
    if (!cleared.ok) return;
    expect(cleared.value.avatarUrl).toBeNull();
  });

  it.each([
    ['not a url', 'not-a-url'],
    ['a non-http protocol', 'javascript:alert(1)'],
    ['an excessively long url', `https://example.com/${'a'.repeat(2048)}`],
  ])('rejects %s', (_label, value) => {
    const result = createMembership().updateAvatarUrl(value);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('keeps the avatar when the display name changes', () => {
    const withAvatar = createMembership().updateAvatarUrl('https://example.com/a.webp');
    expect(withAvatar.ok).toBe(true);
    if (!withAvatar.ok) return;

    const renamed = withAvatar.value.updateDisplayName('Alicia');

    expect(renamed.ok).toBe(true);
    if (!renamed.ok) return;
    expect(renamed.value.avatarUrl).toBe('https://example.com/a.webp');
    expect(renamed.value.displayName).toBe('Alicia');
  });
});
