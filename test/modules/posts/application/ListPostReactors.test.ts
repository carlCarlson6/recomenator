import { describe, expect, it } from 'vitest';

import { Membership } from '../../../../src/modules/groups/domain/Membership.js';
import { Post } from '../../../../src/modules/posts/domain/Post.js';
import { PostReaction } from '../../../../src/modules/posts/domain/PostReaction.js';
import { listPostReactors } from '../../../../src/modules/posts/application/ListPostReactors.js';
import type { MembershipRepository } from '../../../../src/modules/groups/domain/ports/MembershipRepository.js';
import type { PostRepository } from '../../../../src/modules/posts/domain/ports/PostRepository.js';
import type { PostReactionRepository } from '../../../../src/modules/posts/domain/ports/PostReactionRepository.js';
import type { UserReadModel } from '../../../../src/shared/read-models/UserReadModel.js';
import type { Category, ReactionType } from '../../../../src/shared/infrastructure/db/schema.js';

class InMemoryPostRepository implements PostRepository {
  private posts: Map<string, Post> = new Map();

  async findById(id: string): Promise<Post | null> {
    return this.posts.get(id) ?? null;
  }

  async findByIds(ids: string[]): Promise<Post[]> {
    return ids.map((id) => this.posts.get(id)).filter((p): p is Post => p !== undefined);
  }

  async findByGroupId(): Promise<Post[]> {
    return [];
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

class InMemoryMembershipRepository implements MembershipRepository {
  private memberships: Membership[] = [];

  async findByUserAndGroup(userId: string, groupId: string): Promise<Membership | null> {
    return this.memberships.find((m) => m.userId === userId && m.groupId === groupId) ?? null;
  }

  async findByUserId(): Promise<never[]> {
    return [];
  }

  async findByGroupId(): Promise<Membership[]> {
    return this.memberships;
  }

  async save(membership: Membership): Promise<void> {
    const index = this.memberships.findIndex((m) => m.id === membership.id);
    if (index >= 0) {
      this.memberships[index] = membership;
    } else {
      this.memberships.push(membership);
    }
  }

  add(membership: Membership): void {
    this.memberships.push(membership);
  }
}

class InMemoryPostReactionRepository implements PostReactionRepository {
  private reactions: PostReaction[] = [];

  async findCountsByPostIds(postIds: string[]): Promise<
    Array<{ postId: string; type: ReactionType; count: number }>
  > {
    const counts = new Map<string, Map<ReactionType, number>>();
    for (const reaction of this.reactions) {
      if (!postIds.includes(reaction.postId)) continue;
      if (!counts.has(reaction.postId)) counts.set(reaction.postId, new Map());
      const current = counts.get(reaction.postId)!.get(reaction.type) ?? 0;
      counts.get(reaction.postId)!.set(reaction.type, current + 1);
    }

    const result: Array<{ postId: string; type: ReactionType; count: number }> = [];
    for (const [postId, typeMap] of counts) {
      for (const [type, count] of typeMap) {
        result.push({ postId, type, count });
      }
    }
    return result;
  }

  async findByPostIdsAndUserId(postIds: string[], userId: string): Promise<PostReaction[]> {
    return this.reactions.filter((r) => postIds.includes(r.postId) && r.userId === userId);
  }

  async findByUserIdAndGroupId(input: {
    userId: string;
    groupId: string;
    categories?: Category[];
    types?: ReactionType[];
  }): Promise<Array<{ postId: string; type: ReactionType; createdAt: Date }>> {
    return this.reactions
      .filter((r) => r.userId === input.userId)
      .filter((r) => !input.types || input.types.includes(r.type))
      .map((r) => ({ postId: r.postId, type: r.type, createdAt: r.createdAt }));
  }

  async findByPostIdAndType(postId: string, type: ReactionType): Promise<Array<{ userId: string; createdAt: Date }>> {
    return this.reactions
      .filter((r) => r.postId === postId && r.type === type)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((r) => ({ userId: r.userId, createdAt: r.createdAt }));
  }

  async save(reaction: PostReaction): Promise<void> {
    this.reactions.push(reaction);
  }

  async delete(postId: string, userId: string, type: ReactionType): Promise<void> {
    this.reactions = this.reactions.filter(
      (r) => !(r.postId === postId && r.userId === userId && r.type === type),
    );
  }

  add(reaction: PostReaction): void {
    this.reactions.push(reaction);
  }
}

class InMemoryUserReadModel implements UserReadModel {
  private users: Map<string, { username?: string | null; email: string }> = new Map();

  set(userId: string, data: { username?: string | null; email: string }): void {
    this.users.set(userId, data);
  }

  async findDisplayNamesByIds(userIds: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    for (const userId of userIds) {
      const user = this.users.get(userId);
      const displayName = user?.username?.trim() || user?.email || 'Anonymous';
      result.set(userId, displayName);
    }
    return result;
  }
}

function createDeps() {
  return {
    postRepo: new InMemoryPostRepository(),
    membershipRepo: new InMemoryMembershipRepository(),
    postReactionRepo: new InMemoryPostReactionRepository(),
    userReadModel: new InMemoryUserReadModel(),
  };
}

describe('ListPostReactors', () => {
  it('returns reactors sorted by newest reaction first', async () => {
    const deps = createDeps();

    const membership = Membership.create({ userId: 'usr_1', groupId: 'grp_1', displayName: 'Alice' });
    expect(membership.ok).toBe(true);
    if (!membership.ok) return;
    deps.membershipRepo.add(membership.value);

    const post = Post.create({ groupId: 'grp_1', authorId: 'usr_2', category: 'MOVIES', title: 'Inception' });
    expect(post.ok).toBe(true);
    if (!post.ok) return;
    deps.postRepo.add(post.value);

    deps.userReadModel.set('usr_2', { username: 'Bob', email: 'bob@example.com' });
    deps.userReadModel.set('usr_3', { username: 'Charlie', email: 'charlie@example.com' });

    const reaction1 = PostReaction.reconstitute({
      id: 'rct_1',
      postId: post.value.id,
      userId: 'usr_2',
      type: 'liked',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const reaction2 = PostReaction.reconstitute({
      id: 'rct_2',
      postId: post.value.id,
      userId: 'usr_3',
      type: 'liked',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    deps.postReactionRepo.add(reaction1);
    deps.postReactionRepo.add(reaction2);

    const result = await listPostReactors(
      { postId: post.value.id, userId: 'usr_1', type: 'liked' },
      deps,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.reactors.map((r) => ({ userId: r.userId, displayName: r.displayName }))).toEqual([
      { userId: 'usr_3', displayName: 'Charlie' },
      { userId: 'usr_2', displayName: 'Bob' },
    ]);
  });

  it('returns empty reactors when no one reacted with the given type', async () => {
    const deps = createDeps();

    const membership = Membership.create({ userId: 'usr_1', groupId: 'grp_1', displayName: 'Alice' });
    expect(membership.ok).toBe(true);
    if (!membership.ok) return;
    deps.membershipRepo.add(membership.value);

    const post = Post.create({ groupId: 'grp_1', authorId: 'usr_2', category: 'MOVIES', title: 'Inception' });
    expect(post.ok).toBe(true);
    if (!post.ok) return;
    deps.postRepo.add(post.value);

    const result = await listPostReactors(
      { postId: post.value.id, userId: 'usr_1', type: 'liked' },
      deps,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.reactors).toEqual([]);
  });

  it('falls back to email and then Anonymous', async () => {
    const deps = createDeps();

    const membership = Membership.create({ userId: 'usr_1', groupId: 'grp_1', displayName: 'Alice' });
    expect(membership.ok).toBe(true);
    if (!membership.ok) return;
    deps.membershipRepo.add(membership.value);

    const post = Post.create({ groupId: 'grp_1', authorId: 'usr_2', category: 'MOVIES', title: 'Inception' });
    expect(post.ok).toBe(true);
    if (!post.ok) return;
    deps.postRepo.add(post.value);

    deps.userReadModel.set('usr_2', { email: 'bob@example.com' });
    deps.userReadModel.set('usr_3', { email: '', username: null });

    const reaction1 = PostReaction.create({ postId: post.value.id, userId: 'usr_2', type: 'liked' });
    const reaction2 = PostReaction.create({ postId: post.value.id, userId: 'usr_3', type: 'liked' });
    expect(reaction1.ok && reaction2.ok).toBe(true);
    if (!reaction1.ok || !reaction2.ok) return;
    deps.postReactionRepo.add(reaction1.value);
    deps.postReactionRepo.add(reaction2.value);

    const result = await listPostReactors(
      { postId: post.value.id, userId: 'usr_1', type: 'liked' },
      deps,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const names = result.value.reactors.map((r) => r.displayName);
    expect(names).toContain('bob@example.com');
    expect(names).toContain('Anonymous');
  });

  it('returns PostNotFoundError when the post does not exist', async () => {
    const deps = createDeps();

    const result = await listPostReactors(
      { postId: 'pst_missing', userId: 'usr_1', type: 'liked' },
      deps,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('POST_NOT_FOUND');
  });

  it('returns NotGroupMemberError when the requester is not a member', async () => {
    const deps = createDeps();

    const post = Post.create({ groupId: 'grp_1', authorId: 'usr_2', category: 'MOVIES', title: 'Inception' });
    expect(post.ok).toBe(true);
    if (!post.ok) return;
    deps.postRepo.add(post.value);

    const result = await listPostReactors(
      { postId: post.value.id, userId: 'usr_1', type: 'liked' },
      deps,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_GROUP_MEMBER');
  });
});
