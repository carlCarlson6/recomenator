import { describe, expect, it } from 'vitest';

import { Membership } from '#/modules/commands/groups/domain/Membership.js';
import type { MembershipRepository } from '#/modules/commands/groups/domain/ports/MembershipRepository.js';
import { Notification } from '#/modules/commands/notifications/domain/Notification.js';
import type { NotificationRepository } from '#/modules/commands/notifications/domain/ports/NotificationRepository.js';
import {
  addPostReaction,
  removePostReaction,
} from '#/modules/commands/posts/application/PostReactionUseCases.js';
import { Post } from '#/modules/commands/posts/domain/Post.js';
import type { PostRepository } from '#/modules/commands/posts/domain/ports/PostRepository.js';
import type { PostReactionRepository } from '#/modules/commands/posts/domain/ports/PostReactionRepository.js';
import type { Category, ReactionType } from '#/shared/infrastructure/db/schema.js';

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

class InMemoryMembershipRepository implements MembershipRepository {
  private memberships: Membership[] = [];

  async findByUserAndGroup(userId: string, groupId: string): Promise<Membership | null> {
    return this.memberships.find((m) => m.userId === userId && m.groupId === groupId) ?? null;
  }

  async save(membership: Membership): Promise<void> {
    this.memberships.push(membership);
  }

  add(membership: Membership): void {
    this.memberships.push(membership);
  }
}

class InMemoryPostReactionRepository implements PostReactionRepository {
  reactions: Array<{ postId: string; userId: string; type: ReactionType }> = [];

  async save(reaction: { postId: string; userId: string; type: ReactionType }): Promise<void> {
    this.reactions.push(reaction);
  }

  async delete(postId: string, userId: string, type: ReactionType): Promise<void> {
    this.reactions = this.reactions.filter(
      (r) => !(r.postId === postId && r.userId === userId && r.type === type),
    );
  }
}

class InMemoryNotificationRepository implements NotificationRepository {
  notifications: Notification[] = [];

  async save(notification: Notification): Promise<void> {
    this.notifications.push(notification);
  }

  async markSeen(): Promise<void> {}
}

function createDeps() {
  const postRepo = new InMemoryPostRepository();
  const membershipRepo = new InMemoryMembershipRepository();
  const postReactionRepo = new InMemoryPostReactionRepository();
  const notificationRepo = new InMemoryNotificationRepository();
  return { postRepo, membershipRepo, postReactionRepo, notificationRepo };
}

function createPost(overrides?: { groupId?: string; authorId?: string }) {
  const post = Post.create({
    groupId: overrides?.groupId ?? 'grp_1',
    authorId: overrides?.authorId ?? 'usr_1',
    category: 'MOVIES' as Category,
    title: 'Inception',
  });
  expect(post.ok).toBe(true);
  if (!post.ok) throw new Error('Failed to create post');
  return post.value;
}

function createMembership(userId: string, displayName: string) {
  const membership = Membership.create({ userId, groupId: 'grp_1', displayName });
  expect(membership.ok).toBe(true);
  if (!membership.ok) throw new Error('Failed to create membership');
  return membership.value;
}

describe('PostReactionUseCases', () => {
  describe('addPostReaction', () => {
    it('notifies the post author when another user reacts', async () => {
      const deps = createDeps();
      const post = createPost({ authorId: 'usr_1' });
      deps.postRepo.add(post);
      deps.membershipRepo.add(createMembership('usr_1', 'Alice'));
      deps.membershipRepo.add(createMembership('usr_2', 'Bob'));

      const result = await addPostReaction(
        { postId: post.id, userId: 'usr_2', type: 'liked' },
        deps,
      );

      expect(result.ok).toBe(true);
      expect(deps.notificationRepo.notifications).toHaveLength(1);
      const notification = deps.notificationRepo.notifications[0];
      expect(notification.recipientId).toBe('usr_1');
      expect(notification.actorId).toBe('usr_2');
      expect(notification.type).toBe('reaction');
      expect(notification.reactionType).toBe('liked');
      expect(notification.postId).toBe(post.id);
    });

    it('does not notify when the post author reacts to their own post', async () => {
      const deps = createDeps();
      const post = createPost({ authorId: 'usr_1' });
      deps.postRepo.add(post);
      deps.membershipRepo.add(createMembership('usr_1', 'Alice'));

      const result = await addPostReaction(
        { postId: post.id, userId: 'usr_1', type: 'liked' },
        deps,
      );

      expect(result.ok).toBe(true);
      expect(deps.notificationRepo.notifications).toHaveLength(0);
    });
  });

  describe('removePostReaction', () => {
    it('leaves the notification event in place when a reaction is removed', async () => {
      const deps = createDeps();
      const post = createPost({ authorId: 'usr_1' });
      deps.postRepo.add(post);
      deps.membershipRepo.add(createMembership('usr_1', 'Alice'));
      deps.membershipRepo.add(createMembership('usr_2', 'Bob'));

      await addPostReaction({ postId: post.id, userId: 'usr_2', type: 'liked' }, deps);
      const result = await removePostReaction(
        { postId: post.id, userId: 'usr_2', type: 'liked' },
        deps,
      );

      expect(result.ok).toBe(true);
      expect(deps.postReactionRepo.reactions).toHaveLength(0);
      expect(deps.notificationRepo.notifications).toHaveLength(1);
    });
  });
});
