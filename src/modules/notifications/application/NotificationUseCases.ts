import { DrizzleNotificationRepository } from '../infrastructure/DrizzleNotificationRepository.js';

export async function getUnreadGroups(
  input: { userId: string },
  deps: { notificationRepo: DrizzleNotificationRepository },
): Promise<Array<{ groupId: string; count: number }>> {
  return deps.notificationRepo.countUnreadRepliesByGroup(input.userId);
}

export async function markGroupAsRead(
  input: { userId: string; groupId: string },
  deps: { notificationRepo: DrizzleNotificationRepository },
): Promise<void> {
  await deps.notificationRepo.markGroupAsRead(input.userId, input.groupId);
}
