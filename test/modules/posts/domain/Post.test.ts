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
    expect(result.value.rating).toBeNull();
  });

  it('creates a post with a valid rating', () => {
    const result = Post.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MOVIES',
      title: 'Inception',
      rating: 8,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.rating).toBe(8);
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

  it('rejects a rating below 1', () => {
    const result = Post.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MOVIES',
      title: 'Inception',
      rating: 0,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a rating above 10', () => {
    const result = Post.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MOVIES',
      title: 'Inception',
      rating: 11,
    });
    expect(result.ok).toBe(false);
  });

  it('rejects a non-integer rating', () => {
    const result = Post.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MOVIES',
      title: 'Inception',
      rating: 7.5,
    });
    expect(result.ok).toBe(false);
  });
});
