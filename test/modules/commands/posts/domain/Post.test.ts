import { describe, expect, it } from 'vitest';

import { Post } from '#/modules/commands/posts/domain/Post.js';

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

  describe('update', () => {
    function createPost() {
      const result = Post.create({
        groupId: 'grp_1',
        authorId: 'usr_1',
        category: 'MOVIES',
        title: 'Inception',
        description: 'A heist movie',
        externalUrl: 'https://example.com/inception',
        rating: 8,
      });
      if (!result.ok) throw new Error('failed to create post');
      return result.value;
    }

    it('updates the editable fields and preserves identity', () => {
      const post = createPost();

      const result = post.update({
        category: 'MUSIC',
        title: '  Interstellar  ',
        description: '  Space movie  ',
        externalUrl: '  https://example.com/interstellar  ',
        rating: 9,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.id).toBe(post.id);
      expect(result.value.groupId).toBe(post.groupId);
      expect(result.value.authorId).toBe(post.authorId);
      expect(result.value.createdAt).toEqual(post.createdAt);
      expect(result.value.category).toBe('MUSIC');
      expect(result.value.title).toBe('Interstellar');
      expect(result.value.description).toBe('Space movie');
      expect(result.value.externalUrl).toBe('https://example.com/interstellar');
      expect(result.value.rating).toBe(9);
    });

    it('clears the preview when the external url changes', () => {
      const post = createPost().withPreview({
        imageUrl: 'https://img.example/old',
        embedHtml: '<iframe></iframe>',
      });

      const result = post.update({
        category: post.category,
        title: post.title,
        externalUrl: 'https://example.com/other',
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.previewImageUrl).toBeNull();
      expect(result.value.previewEmbedHtml).toBeNull();
    });

    it('clears the preview when the external url is removed', () => {
      const post = createPost().withPreview({
        imageUrl: 'https://img.example/old',
        embedHtml: '<iframe></iframe>',
      });

      const result = post.update({
        category: post.category,
        title: post.title,
        externalUrl: null,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.externalUrl).toBeNull();
      expect(result.value.previewImageUrl).toBeNull();
      expect(result.value.previewEmbedHtml).toBeNull();
    });

    it('keeps the preview when the external url is unchanged', () => {
      const post = createPost().withPreview({
        imageUrl: 'https://img.example/old',
        embedHtml: '<iframe></iframe>',
      });

      const result = post.update({
        category: post.category,
        title: 'Inception (rewatch)',
        externalUrl: post.externalUrl,
      });

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.previewImageUrl).toBe('https://img.example/old');
      expect(result.value.previewEmbedHtml).toBe('<iframe></iframe>');
    });

    it('rejects an empty title', () => {
      const result = createPost().update({
        category: 'MOVIES',
        title: '   ',
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects a rating outside 1–10', () => {
      const result = createPost().update({
        category: 'MOVIES',
        title: 'Inception',
        rating: 11,
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects a description longer than 2000 characters', () => {
      const result = createPost().update({
        category: 'MOVIES',
        title: 'Inception',
        description: 'a'.repeat(2001),
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
