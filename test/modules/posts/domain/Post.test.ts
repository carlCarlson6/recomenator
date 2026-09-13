import { describe, expect, it } from 'vitest';

import { Post } from '../../../../src/modules/posts/domain/Post.js';

describe('Post', () => {
  it('creates a post with a valid title', () => {
    const result = Post.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MOVIES',
      title: 'Inception',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.title).toBe('Inception');
    expect(result.value.category).toBe('MOVIES');
  });

  it('rejects an empty title', () => {
    const result = Post.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MOVIES',
      title: '   ',
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a title that is too long', () => {
    const result = Post.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MOVIES',
      title: 'a'.repeat(201),
    });
    expect(result.ok).toBe(false);
  });
});
