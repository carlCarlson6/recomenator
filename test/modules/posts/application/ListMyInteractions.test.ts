import { describe, expect, it } from 'vitest';

import { listMyInteractions } from '../../../../src/modules/posts/application/ListMyInteractions.js';
import { Membership } from '../../../../src/modules/groups/domain/Membership.js';
import { Post } from '../../../../src/modules/posts/domain/Post.js';
import { PostReaction } from '../../../../src/modules/posts/domain/PostReaction.js';
import { User } from '../../../../src/modules/auth/domain/User.js';
import type { PostRepository } from '../../../../src/modules/posts/domain/ports/PostRepository.js';
import type { PostReactionRepository } from '../../../../src/modules/posts/domain/ports/PostReactionRepository.js';
import type { MembershipRepository } from '../../../../src/modules/groups/domain/ports/MembershipRepository.js';
import type { UserRepository } from '../../../../src/modules/auth/domain/ports/UserRepository.js';
import type { ReplyRepository } from '../../../../src/modules/replies/domain/ports/ReplyRepository.js';
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
    return this.reactions.filter(
      (r) => postIds.includes(r.postId) && r.userId === userId,
    );
  }

  async findByUserIdAndGroupId(input: {
    userId: string;
    groupId: string;
    categories?: Category[];
    types?: ReactionType[];
  }): Promise<Array<{ postId: string; type: ReactionType; createdAt: Date }>> {
    const result: Array<{ postId: string; type: ReactionType; createdAt: Date }> = [];
    for (const reaction of this.reactions) {
      if (reaction.userId !== input.userId) continue;
      // Group filtering is applied by the caller in real DB; here we rely on post IDs.
      if (input.types && !input.types.includes(reaction.type)) continue;
      result.push({
        postId: reaction.postId,
        type: reaction.type,
        createdAt: reaction.createdAt,
      });
    }
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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

class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return ids.map((id) => this.users.get(id)).filter((u): u is User => u !== undefined);
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  add(user: User): void {
    this.users.set(user.id, user);
  }
}

class InMemoryReplyRepository implements ReplyRepository {
  async findByPostId(): Promise<never[]> {
    return [];
  }

  async countByPostIds(postIds: string[]): Promise<Array<{ postId: string; count: number }>> {
    return postIds.map((postId) => ({ postId, count: 0 }));
  }

  async save(): Promise<void> {}
}

function createDeps() {
  return {
    postRepo: new InMemoryPostRepository(),
    membershipRepo: new InMemoryMembershipRepository(),
    userRepo: new InMemoryUserRepository(),
    postReactionRepo: new InMemoryPostReactionRepository(),
    replyRepo: new InMemoryReplyRepository(),
  };
}

describe('ListMyInteractions', () => {
  it('returns empty list when the user has no reactions', async () => {
    const deps = createDeps();
    const membership = Membership.create({ userId: 'usr_1', groupId: 'grp_1', displayName: 'Alice' });
    expect(membership.ok).toBe(true);
    if (!membership.ok) return;
    deps.membershipRepo.add(membership.value);

    const result = await listMyInteractions(
      { groupId: 'grp_1', userId: 'usr_1' },
      deps,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toEqual([]);
  });

  it('returns NotGroupMemberError when the user is not a member', async () => {
    const deps = createDeps();

    const result = await listMyInteractions(
      { groupId: 'grp_1', userId: 'usr_1' },
      deps,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_GROUP_MEMBER');
  });

  it('returns posts sorted by newest reaction first', async () => {
    const deps = createDeps();
    const membership = Membership.create({ userId: 'usr_1', groupId: 'grp_1', displayName: 'Alice' });
    expect(membership.ok).toBe(true);
    if (!membership.ok) return;
    deps.membershipRepo.add(membership.value);

    const post1 = Post.create({ groupId: 'grp_1', authorId: 'usr_2', category: 'MOVIES', title: 'Inception' });
    const post2 = Post.create({ groupId: 'grp_1', authorId: 'usr_2', category: 'MUSIC', title: 'Discovery' });
    expect(post1.ok && post2.ok).toBe(true);
    if (!post1.ok || !post2.ok) return;
    deps.postRepo.add(post1.value);
    deps.postRepo.add(post2.value);

    const reaction1 = PostReaction.reconstitute({
      id: 'rct_1',
      postId: post1.value.id,
      userId: 'usr_1',
      type: 'liked',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const reaction2 = PostReaction.reconstitute({
      id: 'rct_2',
      postId: post2.value.id,
      userId: 'usr_1',
      type: 'viewed',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    deps.postReactionRepo.add(reaction1);
    deps.postReactionRepo.add(reaction2);

    const result = await listMyInteractions(
      { groupId: 'grp_1', userId: 'usr_1' },
      deps,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.map((p) => p.id)).toEqual([post2.value.id, post1.value.id]);
  });

  it('filters by category and reaction type', async () => {
    const deps = createDeps();
    const membership = Membership.create({ userId: 'usr_1', groupId: 'grp_1', displayName: 'Alice' });
    expect(membership.ok).toBe(true);
    if (!membership.ok) return;
    deps.membershipRepo.add(membership.value);

    const post1 = Post.create({ groupId: 'grp_1', authorId: 'usr_2', category: 'MOVIES', title: 'Inception' });
    const post2 = Post.create({ groupId: 'grp_1', authorId: 'usr_2', category: 'MUSIC', title: 'Discovery' });
    expect(post1.ok && post2.ok).toBe(true);
    if (!post1.ok || !post2.ok) return;
    deps.postRepo.add(post1.value);
    deps.postRepo.add(post2.value);

    const reaction1 = PostReaction.reconstitute({
      id: 'rct_1',
      postId: post1.value.id,
      userId: 'usr_1',
      type: 'liked',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const reaction2 = PostReaction.reconstitute({
      id: 'rct_2',
      postId: post2.value.id,
      userId: 'usr_1',
      type: 'viewed',
      createdAt: new Date('2026-01-02T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });
    deps.postReactionRepo.add(reaction1);
    deps.postReactionRepo.add(reaction2);

    const result = await listMyInteractions(
      {
        groupId: 'grp_1',
        userId: 'usr_1',
        categories: ['MOVIES'],
        types: ['liked'],
      },
      deps,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0].id).toBe(post1.value.id);
  });

  it('exposes reaction counts and myReactions in the DTO', async () => {
    const deps = createDeps();
    const membership = Membership.create({ userId: 'usr_1', groupId: 'grp_1', displayName: 'Alice' });
    expect(membership.ok).toBe(true);
    if (!membership.ok) return;
    deps.membershipRepo.add(membership.value);

    const user2 = User.create({ id: 'usr_2', email: 'bob@example.com' });
    deps.userRepo.add(user2);

    const post = Post.create({ groupId: 'grp_1', authorId: 'usr_2', category: 'MOVIES', title: 'Inception' });
    expect(post.ok).toBe(true);
    if (!post.ok) return;
    deps.postRepo.add(post.value);

    const reaction1 = PostReaction.create({ postId: post.value.id, userId: 'usr_1', type: 'liked' });
    const reaction2 = PostReaction.create({ postId: post.value.id, userId: 'usr_2', type: 'liked' });
    const reaction3 = PostReaction.create({ postId: post.value.id, userId: 'usr_1', type: 'viewed' });
    expect(reaction1.ok && reaction2.ok && reaction3.ok).toBe(true);
    if (!reaction1.ok || !reaction2.ok || !reaction3.ok) return;
    deps.postReactionRepo.add(reaction1.value);
    deps.postReactionRepo.add(reaction2.value);
    deps.postReactionRepo.add(reaction3.value);

    const result = await listMyInteractions(
      { groupId: 'grp_1', userId: 'usr_1' },
      deps,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);

    const dto = result.value[0];
    expect(dto.myReactions.sort()).toEqual(['liked', 'viewed']);
    expect(dto.reactions.find((r) => r.type === 'liked')?.count).toBe(2);
    expect(dto.reactions.find((r) => r.type === 'viewed')?.count).toBe(1);
    expect(dto.reactions.find((r) => r.type === 'interested')?.count).toBe(0);
  });
});
