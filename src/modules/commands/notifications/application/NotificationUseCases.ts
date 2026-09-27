import { DrizzleNotificationRepository } from '../infrastructure/DrizzleNotificationRepository.js';

export async function markGroupAsRead(
  input: { userId: string; groupId: string },
  deps: { notificationRepo: DrizzleNotificationRepository },
): Promise<void> {
  await deps.notificationRepo.markGroupAsRead(input.userId, input.groupId);
}
