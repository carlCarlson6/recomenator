import { describe, expect, it } from 'vitest';

import {
  markNotificationsSeen,
  notifyInteraction,
} from '#/modules/commands/notifications/application/NotificationUseCases.js';
import { Notification } from '#/modules/commands/notifications/domain/Notification.js';
import type { NotificationRepository } from '#/modules/commands/notifications/domain/ports/NotificationRepository.js';

class InMemoryNotificationRepository implements NotificationRepository {
  notifications: Notification[] = [];
  shouldFail = false;
  markSeenCalls: Array<{ userId: string; groupId: string }> = [];

  async save(notification: Notification): Promise<void> {
    if (this.shouldFail) throw new Error('notification save failed');
    this.notifications.push(notification);
  }

  async markSeen(userId: string, groupId: string): Promise<void> {
    this.markSeenCalls.push({ userId, groupId });
    const seenAt = new Date();
    this.notifications = this.notifications.map((n) =>
      n.recipientId === userId && n.groupId === groupId && n.seenAt === null
        ? n.markSeen(seenAt)
        : n,
    );
  }
}

function createDeps() {
  const notificationRepo = new InMemoryNotificationRepository();
  return { notificationRepo };
}

describe('Notification', () => {
  it('creates an unseen notification with a prefixed id', async () => {
    const notification = Notification.create({
      recipientId: 'usr_1',
      groupId: 'grp_1',
      postId: 'pst_1',
      actorId: 'usr_2',
      type: 'reaction',
      reactionType: 'liked',
    });

    expect(notification.id.startsWith('ntf_')).toBe(true);
    expect(notification.seenAt).toBeNull();
    expect(notification.replyId).toBeNull();
    expect(notification.createdAt).toBeInstanceOf(Date);
  });
});

describe('NotificationUseCases', () => {
  describe('notifyInteraction', () => {
    it('creates a reaction notification for the post author', async () => {
      const deps = createDeps();

      await notifyInteraction(
        {
          recipientId: 'usr_1',
          groupId: 'grp_1',
          postId: 'pst_1',
          actorId: 'usr_2',
          type: 'reaction',
          reactionType: 'liked',
        },
        deps,
      );

      expect(deps.notificationRepo.notifications).toHaveLength(1);
      const notification = deps.notificationRepo.notifications[0];
      expect(notification.recipientId).toBe('usr_1');
      expect(notification.actorId).toBe('usr_2');
      expect(notification.groupId).toBe('grp_1');
      expect(notification.postId).toBe('pst_1');
      expect(notification.type).toBe('reaction');
      expect(notification.reactionType).toBe('liked');
      expect(notification.seenAt).toBeNull();
    });

    it('creates a reply notification linked to the reply', async () => {
      const deps = createDeps();

      await notifyInteraction(
        {
          recipientId: 'usr_1',
          groupId: 'grp_1',
          postId: 'pst_1',
          actorId: 'usr_2',
          type: 'reply',
          replyId: 'rpl_1',
        },
        deps,
      );

      expect(deps.notificationRepo.notifications).toHaveLength(1);
      const notification = deps.notificationRepo.notifications[0];
      expect(notification.type).toBe('reply');
      expect(notification.replyId).toBe('rpl_1');
      expect(notification.reactionType).toBeNull();
    });

    it('does not notify when the actor is the recipient', async () => {
      const deps = createDeps();

      await notifyInteraction(
        {
          recipientId: 'usr_1',
          groupId: 'grp_1',
          postId: 'pst_1',
          actorId: 'usr_1',
          type: 'reply',
          replyId: 'rpl_1',
        },
        deps,
      );

      expect(deps.notificationRepo.notifications).toHaveLength(0);
    });

    it('does not throw when the repository fails', async () => {
      const deps = createDeps();
      deps.notificationRepo.shouldFail = true;

      await expect(
        notifyInteraction(
          {
            recipientId: 'usr_1',
            groupId: 'grp_1',
            postId: 'pst_1',
            actorId: 'usr_2',
            type: 'reply',
            replyId: 'rpl_1',
          },
          deps,
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('markNotificationsSeen', () => {
    it('marks unseen notifications of the user in the group as seen', async () => {
      const deps = createDeps();

      await notifyInteraction(
        {
          recipientId: 'usr_1',
          groupId: 'grp_1',
          postId: 'pst_1',
          actorId: 'usr_2',
          type: 'reaction',
          reactionType: 'liked',
        },
        deps,
      );
      await notifyInteraction(
        {
          recipientId: 'usr_1',
          groupId: 'grp_2',
          postId: 'pst_2',
          actorId: 'usr_2',
          type: 'reaction',
          reactionType: 'liked',
        },
        deps,
      );

      await markNotificationsSeen({ userId: 'usr_1', groupId: 'grp_1' }, deps);

      expect(deps.notificationRepo.markSeenCalls).toEqual([
        { userId: 'usr_1', groupId: 'grp_1' },
      ]);
      expect(deps.notificationRepo.notifications[0].seenAt).toBeInstanceOf(Date);
      expect(deps.notificationRepo.notifications[1].seenAt).toBeNull();
    });
  });
});
