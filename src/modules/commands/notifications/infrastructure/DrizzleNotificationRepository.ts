import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import { notifications } from '#/shared/infrastructure/db/schema.js';

import type { Notification } from '../domain/Notification.js';
import type { NotificationRepository } from '../domain/ports/NotificationRepository.js';

export class DrizzleNotificationRepository implements NotificationRepository {
  async save(notification: Notification): Promise<void> {
    await db.insert(notifications).values({
      id: notification.id,
      recipientId: notification.recipientId,
      groupId: notification.groupId,
      postId: notification.postId,
      actorId: notification.actorId,
      type: notification.type,
      reactionType: notification.reactionType,
      replyId: notification.replyId,
      seenAt: notification.seenAt,
      createdAt: notification.createdAt,
    });
  }

  async markSeen(userId: string, groupId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ seenAt: sql`now()` })
      .where(
        and(
          eq(notifications.recipientId, userId),
          eq(notifications.groupId, groupId),
          isNull(notifications.seenAt),
        ),
      );
  }
}
