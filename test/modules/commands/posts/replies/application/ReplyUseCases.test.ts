import { describe, expect, it } from 'vitest';

import { addReply, deleteReply } from '#/modules/commands/posts/replies/application/ReplyUseCases.js';
import { Reply } from '#/modules/commands/posts/replies/domain/Reply.js';
import type { ReplyRepository } from '#/modules/commands/posts/replies/domain/ports/ReplyRepository.js';
import { Post } from '#/modules/commands/posts/domain/Post.js';
import type { PostRepository } from '#/modules/commands/posts/domain/ports/PostRepository.js';
import { Membership } from '#/modules/commands/groups/domain/Membership.js';
import type { MembershipRepository } from '#/modules/commands/groups/domain/ports/MembershipRepository.js';
import { Notification } from '#/modules/commands/notifications/domain/Notification.js';
import type { NotificationRepository } from '#/modules/commands/notifications/domain/ports/NotificationRepository.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';

class InMemoryReplyRepository implements ReplyRepository {
  private replies: Map<string, Reply> = new Map();

  async findById(id: string): Promise<Reply | null> {
    return this.replies.get(id) ?? null;
  }

  async save(reply: Reply): Promise<void> {
    this.replies.set(reply.id, reply);
  }

  add(reply: Reply): void {
    this.replies.set(reply.id, reply);
  }
}

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
    const index = this.memberships.findIndex((m) => m.id === membership.id);
    if (index >= 0) this.memberships[index] = membership;
    else this.memberships.push(membership);
  }

  add(membership: Membership): void {
    this.memberships.push(membership);
  }
}

class InMemoryNotificationRepository implements NotificationRepository {
  notifications: Notification[] = [];
  shouldFail = false;

  async save(notification: Notification): Promise<void> {
    if (this.shouldFail) throw new Error('notification save failed');
    this.notifications.push(notification);
  }

  async markSeen(): Promise<void> {}
}

function createDeps() {
  const replyRepo = new InMemoryReplyRepository();
  const postRepo = new InMemoryPostRepository();
  const membershipRepo = new InMemoryMembershipRepository();
  const notificationRepo = new InMemoryNotificationRepository();
  return { replyRepo, postRepo, membershipRepo, notificationRepo };
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

function createMembership(overrides?: { userId?: string; groupId?: string; displayName?: string }) {
  const membership = Membership.create({
    userId: overrides?.userId ?? 'usr_1',
    groupId: overrides?.groupId ?? 'grp_1',
    displayName: overrides?.displayName ?? 'Alice',
  });
  expect(membership.ok).toBe(true);
  if (!membership.ok) throw new Error('Failed to create membership');
  return membership.value;
}

describe('ReplyUseCases', () => {
  describe('addReply', () => {
    it('adds a top-level reply', async () => {
      const deps = createDeps();
      const post = createPost();
      deps.postRepo.add(post);
      deps.membershipRepo.add(createMembership());

      const result = await addReply(
        { postId: post.id, authorId: 'usr_1', content: 'Nice!' },
        deps,
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value.postId).toBe(post.id);
      expect(result.value.parentId).toBeNull();
      expect(result.value.authorDisplayName).toBe('Alice');

      const stored = await deps.replyRepo.findById(result.value.id);
      expect(stored).not.toBeNull();
    });

    it('notifies the post author when another user replies', async () => {
      const deps = createDeps();
      const post = createPost({ authorId: 'usr_1' });
      deps.postRepo.add(post);
      deps.membershipRepo.add(createMembership({ userId: 'usr_1', displayName: 'Alice' }));
      deps.membershipRepo.add(createMembership({ userId: 'usr_2', displayName: 'Bob' }));

      const result = await addReply(
        { postId: post.id, authorId: 'usr_2', content: 'Nice!' },
        deps,
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(deps.notificationRepo.notifications).toHaveLength(1);
      const notification = deps.notificationRepo.notifications[0];
      expect(notification.recipientId).toBe('usr_1');
      expect(notification.actorId).toBe('usr_2');
      expect(notification.groupId).toBe(post.groupId);
      expect(notification.postId).toBe(post.id);
      expect(notification.type).toBe('reply');
      expect(notification.replyId).toBe(result.value.id);
    });

    it('notifies only the post author for a nested reply, not the parent reply author', async () => {
      const deps = createDeps();
      const post = createPost({ authorId: 'usr_1' });
      deps.postRepo.add(post);
      deps.membershipRepo.add(createMembership({ userId: 'usr_1', displayName: 'Alice' }));
      deps.membershipRepo.add(createMembership({ userId: 'usr_2', displayName: 'Bob' }));
      deps.membershipRepo.add(createMembership({ userId: 'usr_3', displayName: 'Cara' }));

      const parent = await addReply(
        { postId: post.id, authorId: 'usr_2', content: 'Parent' },
        deps,
      );
      expect(parent.ok).toBe(true);
      if (!parent.ok) return;

      const child = await addReply(
        { postId: post.id, authorId: 'usr_3', content: 'Child', parentId: parent.value.id },
        deps,
      );

      expect(child.ok).toBe(true);
      expect(deps.notificationRepo.notifications).toHaveLength(2);
      expect(deps.notificationRepo.notifications.map((n) => n.recipientId)).toEqual([
        'usr_1',
        'usr_1',
      ]);
    });

    it('does not notify when the post author replies to their own post', async () => {
      const deps = createDeps();
      const post = createPost({ authorId: 'usr_1' });
      deps.postRepo.add(post);
      deps.membershipRepo.add(createMembership({ userId: 'usr_1', displayName: 'Alice' }));

      const result = await addReply(
        { postId: post.id, authorId: 'usr_1', content: 'Mine' },
        deps,
      );

      expect(result.ok).toBe(true);
      expect(deps.notificationRepo.notifications).toHaveLength(0);
    });

    it('still adds the reply when the notification repository fails', async () => {
      const deps = createDeps();
      const post = createPost({ authorId: 'usr_1' });
      deps.postRepo.add(post);
      deps.membershipRepo.add(createMembership({ userId: 'usr_1', displayName: 'Alice' }));
      deps.membershipRepo.add(createMembership({ userId: 'usr_2', displayName: 'Bob' }));
      deps.notificationRepo.shouldFail = true;

      const result = await addReply(
        { postId: post.id, authorId: 'usr_2', content: 'Nice!' },
        deps,
      );

      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const stored = await deps.replyRepo.findById(result.value.id);
      expect(stored).not.toBeNull();
    });

    it('adds a nested reply to an existing reply', async () => {
      const deps = createDeps();
      const post = createPost();
      deps.postRepo.add(post);
      deps.membershipRepo.add(createMembership({ userId: 'usr_1', displayName: 'Alice' }));
      deps.membershipRepo.add(createMembership({ userId: 'usr_2', displayName: 'Bob' }));

      const parent = await addReply(
        { postId: post.id, authorId: 'usr_1', content: 'Parent' },
        deps,
      );
      expect(parent.ok).toBe(true);
      if (!parent.ok) return;

      const child = await addReply(
        { postId: post.id, authorId: 'usr_2', content: 'Child', parentId: parent.value.id },
        deps,
      );

      expect(child.ok).toBe(true);
      if (!child.ok) return;
      expect(child.value.parentId).toBe(parent.value.id);
    });

    it('rejects a nested reply when the parent does not exist', async () => {
      const deps = createDeps();
      const post = createPost();
      deps.postRepo.add(post);
      deps.membershipRepo.add(createMembership());

      const result = await addReply(
        { postId: post.id, authorId: 'usr_1', content: 'Child', parentId: 'rpl_missing' },
        deps,
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('REPLY_NOT_FOUND');
    });

    it('rejects a nested reply when the parent is deleted', async () => {
      const deps = createDeps();
      const post = createPost();
      deps.postRepo.add(post);
      deps.membershipRepo.add(createMembership({ userId: 'usr_1', displayName: 'Alice' }));
      deps.membershipRepo.add(createMembership({ userId: 'usr_2', displayName: 'Bob' }));

      const parent = await addReply(
        { postId: post.id, authorId: 'usr_1', content: 'Parent' },
        deps,
      );
      expect(parent.ok).toBe(true);
      if (!parent.ok) return;

      const stored = await deps.replyRepo.findById(parent.value.id);
      expect(stored).not.toBeNull();
      if (!stored) return;
      await deps.replyRepo.save(stored.delete());

      const child = await addReply(
        { postId: post.id, authorId: 'usr_2', content: 'Child', parentId: parent.value.id },
        deps,
      );

      expect(child.ok).toBe(false);
      if (child.ok) return;
      expect(child.error.code).toBe('REPLY_TO_DELETED_REPLY');
    });

    it('rejects a nested reply when the parent belongs to a different post', async () => {
      const deps = createDeps();
      const post1 = createPost({ groupId: 'grp_1' });
      const post2 = createPost({ groupId: 'grp_1' });
      deps.postRepo.add(post1);
      deps.postRepo.add(post2);
      deps.membershipRepo.add(createMembership({ userId: 'usr_1', displayName: 'Alice' }));
      deps.membershipRepo.add(createMembership({ userId: 'usr_2', displayName: 'Bob' }));

      const parent = await addReply(
        { postId: post1.id, authorId: 'usr_1', content: 'Parent' },
        deps,
      );
      expect(parent.ok).toBe(true);
      if (!parent.ok) return;

      const child = await addReply(
        { postId: post2.id, authorId: 'usr_2', content: 'Child', parentId: parent.value.id },
        deps,
      );

      expect(child.ok).toBe(false);
      if (child.ok) return;
      expect(child.error.code).toBe('REPLY_POST_MISMATCH');
    });

    it('rejects when the post does not exist', async () => {
      const deps = createDeps();
      deps.membershipRepo.add(createMembership());

      const result = await addReply(
        { postId: 'pst_missing', authorId: 'usr_1', content: 'Hello' },
        deps,
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('POST_NOT_FOUND');
    });

    it('rejects when the user is not a group member', async () => {
      const deps = createDeps();
      const post = createPost();
      deps.postRepo.add(post);

      const result = await addReply(
        { postId: post.id, authorId: 'usr_1', content: 'Hello' },
        deps,
      );

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('NOT_GROUP_MEMBER');
    });
  });

  describe('deleteReply', () => {
    it('deletes own reply', async () => {
      const deps = createDeps();
      const post = createPost();
      deps.postRepo.add(post);
      deps.membershipRepo.add(createMembership());

      const created = await addReply(
        { postId: post.id, authorId: 'usr_1', content: 'Hello' },
        deps,
      );
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const result = await deleteReply({ replyId: created.value.id, userId: 'usr_1' }, deps);

      expect(result.ok).toBe(true);
      const stored = await deps.replyRepo.findById(created.value.id);
      expect(stored).not.toBeNull();
      if (!stored) return;
      expect(stored.deletedAt).toBeInstanceOf(Date);
    });

    it('rejects deleting a non-existent reply', async () => {
      const deps = createDeps();

      const result = await deleteReply({ replyId: 'rpl_missing', userId: 'usr_1' }, deps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('REPLY_NOT_FOUND');
    });

    it('rejects deleting another user\'s reply', async () => {
      const deps = createDeps();
      const post = createPost();
      deps.postRepo.add(post);
      deps.membershipRepo.add(createMembership({ userId: 'usr_1', displayName: 'Alice' }));
      deps.membershipRepo.add(createMembership({ userId: 'usr_2', displayName: 'Bob' }));

      const created = await addReply(
        { postId: post.id, authorId: 'usr_1', content: 'Hello' },
        deps,
      );
      expect(created.ok).toBe(true);
      if (!created.ok) return;

      const result = await deleteReply({ replyId: created.value.id, userId: 'usr_2' }, deps);

      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.code).toBe('UNAUTHORIZED');

      const stored = await deps.replyRepo.findById(created.value.id);
      expect(stored).not.toBeNull();
      if (!stored) return;
      expect(stored.deletedAt).toBeNull();
    });
  });
});
