import { describe, expect, it } from 'vitest';

import { editPost } from '#/modules/commands/posts/application/EditPost.js';
import { Post } from '#/modules/commands/posts/domain/Post.js';
import type { PostRepository } from '#/modules/commands/posts/domain/ports/PostRepository.js';
import type { LinkPreviewService } from '#/modules/commands/posts/linkPreview/application/ports/LinkPreviewService.js';

class InMemoryPostRepository implements PostRepository {
  private posts: Map<string, Post> = new Map();

  async findById(id: string): Promise<Post | null> {
    return this.posts.get(id) ?? null;
  }

  async save(post: Post): Promise<void> {
    this.posts.set(post.id, post);
  }

  async delete(id: string): Promise<void> {
    this.posts.delete(id);
  }

  add(post: Post): void {
    this.posts.set(post.id, post);
  }
}

class FakeLinkPreviewService implements LinkPreviewService {
  readonly calls: string[] = [];

  async fetch(url: string) {
    this.calls.push(url);
    return { imageUrl: `https://img.example/${encodeURIComponent(url)}` };
  }
}

function createDeps() {
  return {
    postRepo: new InMemoryPostRepository(),
    linkPreviewService: new FakeLinkPreviewService(),
  };
}

type Deps = ReturnType<typeof createDeps>;

function addPost(deps: Deps, overrides: { externalUrl?: string } = {}): Post {
  const result = Post.create({
    groupId: 'grp_1',
    authorId: 'usr_1',
    category: 'MOVIES',
    title: 'Inception',
    externalUrl: overrides.externalUrl,
  });
  if (!result.ok) throw new Error('failed to create post');
  deps.postRepo.add(result.value);
  return result.value;
}

describe('editPost', () => {
  it('updates a post owned by the user', async () => {
    const deps = createDeps();
    const post = addPost(deps);

    const result = await editPost(
      {
        postId: post.id,
        userId: 'usr_1',
        category: 'MUSIC',
        title: 'Interstellar',
        description: 'Space movie',
        rating: 9,
      },
      deps,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toBe(post.id);

    const saved = await deps.postRepo.findById(post.id);
    expect(saved?.title).toBe('Interstellar');
    expect(saved?.category).toBe('MUSIC');
    expect(saved?.description).toBe('Space movie');
    expect(saved?.rating).toBe(9);
    expect(saved?.authorId).toBe('usr_1');
  });

  it('rejects editing a non-existent post', async () => {
    const deps = createDeps();

    const result = await editPost(
      { postId: 'pst_missing', userId: 'usr_1', category: 'MOVIES', title: 'Inception' },
      deps,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('rejects editing a post owned by another user', async () => {
    const deps = createDeps();
    const post = addPost(deps);

    const result = await editPost(
      { postId: post.id, userId: 'usr_2', category: 'MOVIES', title: 'Hacked' },
      deps,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('UNAUTHORIZED');

    const saved = await deps.postRepo.findById(post.id);
    expect(saved?.title).toBe('Inception');
  });

  it('rejects an invalid update', async () => {
    const deps = createDeps();
    const post = addPost(deps);

    const result = await editPost(
      { postId: post.id, userId: 'usr_1', category: 'MOVIES', title: '   ' },
      deps,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION_ERROR');

    const saved = await deps.postRepo.findById(post.id);
    expect(saved?.title).toBe('Inception');
  });

  it('refetches the link preview when the link changes', async () => {
    const deps = createDeps();
    const post = addPost(deps, { externalUrl: 'https://example.com/old' });

    const result = await editPost(
      {
        postId: post.id,
        userId: 'usr_1',
        category: 'MOVIES',
        title: 'Inception',
        externalUrl: 'https://example.com/new',
      },
      deps,
    );

    expect(result.ok).toBe(true);
    expect(deps.linkPreviewService.calls).toEqual(['https://example.com/new']);

    const saved = await deps.postRepo.findById(post.id);
    expect(saved?.previewImageUrl).toBe(
      `https://img.example/${encodeURIComponent('https://example.com/new')}`,
    );
  });

  it('keeps the existing preview when the link is unchanged', async () => {
    const deps = createDeps();
    const post = addPost(deps, { externalUrl: 'https://example.com/old' }).withPreview({
      imageUrl: 'https://img.example/old',
    });
    deps.postRepo.add(post);

    const result = await editPost(
      {
        postId: post.id,
        userId: 'usr_1',
        category: 'MOVIES',
        title: 'Inception (rewatch)',
        externalUrl: 'https://example.com/old',
      },
      deps,
    );

    expect(result.ok).toBe(true);
    expect(deps.linkPreviewService.calls).toEqual([]);

    const saved = await deps.postRepo.findById(post.id);
    expect(saved?.previewImageUrl).toBe('https://img.example/old');
  });

  it('clears the preview when the link is removed', async () => {
    const deps = createDeps();
    const post = addPost(deps, { externalUrl: 'https://example.com/old' }).withPreview({
      imageUrl: 'https://img.example/old',
    });
    deps.postRepo.add(post);

    const result = await editPost(
      {
        postId: post.id,
        userId: 'usr_1',
        category: 'MOVIES',
        title: 'Inception',
      },
      deps,
    );

    expect(result.ok).toBe(true);
    expect(deps.linkPreviewService.calls).toEqual([]);

    const saved = await deps.postRepo.findById(post.id);
    expect(saved?.externalUrl).toBeNull();
    expect(saved?.previewImageUrl).toBeNull();
  });
});
