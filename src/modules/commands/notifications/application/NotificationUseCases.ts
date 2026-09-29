import type { NotificationType, ReactionType } from '#/shared/infrastructure/db/schema.js';

import { Notification } from '../domain/Notification.js';
import type { NotificationRepository } from '../domain/ports/NotificationRepository.js';

export async function notifyInteraction(
  input: {
    recipientId: string;
    groupId: string;
    postId: string;
    actorId: string;
    type: NotificationType;
    reactionType?: ReactionType | null;
    replyId?: string | null;
  },
  deps: { notificationRepo: NotificationRepository },
): Promise<void> {
  if (input.actorId === input.recipientId) return;

  try {
    await deps.notificationRepo.save(Notification.create(input));
  } catch {}
}

export async function markNotificationsSeen(
  input: { userId: string; groupId: string },
  deps: { notificationRepo: NotificationRepository },
): Promise<void> {
  await deps.notificationRepo.markSeen(input.userId, input.groupId);
}
