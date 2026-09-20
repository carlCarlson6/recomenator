import { describe, expect, it } from 'vitest';

import { deletePost } from '../../../../src/modules/posts/application/DeletePost.js';
import { Post } from '../../../../src/modules/posts/domain/Post.js';
import type { PostRepository } from '../../../../src/modules/posts/domain/ports/PostRepository.js';

class InMemoryPostRepository implements PostRepository {
  private posts: Map<string, Post> = new Map();

  async findById(id: string): Promise<Post | null> {
    return this.posts.get(id) ?? null;
  }

  async findByIds(ids: string[]): Promise<Post[]> {
    return ids.map((id) => this.posts.get(id)).filter((p): p is Post => p !== undefined);
  }

  async findByGroupId(): Promise<Post[]> {
    return Array.from(this.posts.values());
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

function createDeps() {
  return {
    postRepo: new InMemoryPostRepository(),
  };
}

describe('deletePost', () => {
  it('deletes a post owned by the user', async () => {
    const deps = createDeps();
    const post = Post.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MOVIES',
      title: 'Inception',
    });
    expect(post.ok).toBe(true);
    if (!post.ok) return;
    deps.postRepo.add(post.value);

    const result = await deletePost({ postId: post.value.id, userId: 'usr_1' }, deps);

    expect(result.ok).toBe(true);
    const remaining = await deps.postRepo.findById(post.value.id);
    expect(remaining).toBeNull();
  });

  it('rejects deleting a non-existent post', async () => {
    const deps = createDeps();

    const result = await deletePost({ postId: 'pst_missing', userId: 'usr_1' }, deps);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('rejects deleting a post owned by another user', async () => {
    const deps = createDeps();
    const post = Post.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MOVIES',
      title: 'Inception',
    });
    expect(post.ok).toBe(true);
    if (!post.ok) return;
    deps.postRepo.add(post.value);

    const result = await deletePost({ postId: post.value.id, userId: 'usr_2' }, deps);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('UNAUTHORIZED');

    const remaining = await deps.postRepo.findById(post.value.id);
    expect(remaining).not.toBeNull();
  });
});
