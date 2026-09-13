import { describe, expect, it } from 'vitest';

import { PostReaction } from '../../../../src/modules/posts/domain/PostReaction.js';

describe('PostReaction', () => {
  it('creates a valid reaction', () => {
    const result = PostReaction.create({
      postId: 'pst_1',
      userId: 'usr_1',
      type: 'liked',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.postId).toBe('pst_1');
    expect(result.value.userId).toBe('usr_1');
    expect(result.value.type).toBe('liked');
  });

  it.each(['interested', 'liked', 'not_liked', 'viewed'] as const)(
    'accepts the %s reaction type',
    (type) => {
      const result = PostReaction.create({
        postId: 'pst_1',
        userId: 'usr_1',
        type,
      });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.type).toBe(type);
    },
  );

  it('rejects an invalid reaction type', () => {
    const result = PostReaction.create({
      postId: 'pst_1',
      userId: 'usr_1',
      // @ts-expect-error testing invalid input
      type: 'loved',
    });
    expect(result.ok).toBe(false);
  });
});
