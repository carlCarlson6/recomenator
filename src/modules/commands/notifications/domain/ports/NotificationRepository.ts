import type { Notification } from '../Notification.js';

export interface NotificationRepository {
  save(notification: Notification): Promise<void>;
  markSeen(userId: string, groupId: string): Promise<void>;
}
