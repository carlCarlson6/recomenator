import { eq, and, count, isNull } from 'drizzle-orm';
import { db } from '#/shared/infrastructure/db/client.js';
import { groups, memberships, notifications } from '#/shared/infrastructure/db/schema.js';

export type GroupListItemRM = {
  id: string;
  name: string;
  displayName: string;
  role: 'owner' | 'member';
  unreadCount: number;
};

export async function getHomeData(userId: string): Promise<GroupListItemRM[]> {
  const groupRows = await db
    .select({
      id: groups.id,
      name: groups.name,
      displayName: memberships.displayName,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(groups, eq(groups.id, memberships.groupId))
    .where(eq(memberships.userId, userId))
    .orderBy(groups.name);

  const unreadRows = await db
    .select({
      groupId: notifications.groupId,
      count: count(notifications.id),
    })
    .from(notifications)
    .where(and(eq(notifications.recipientId, userId), isNull(notifications.seenAt)))
    .groupBy(notifications.groupId);

  const unreadMap = new Map(unreadRows.map((r) => [r.groupId, Number(r.count)]));

  return groupRows.map((r) => ({
    id: r.id,
    name: r.name,
    displayName: r.displayName,
    role: r.role as 'owner' | 'member',
    unreadCount: unreadMap.get(r.id) ?? 0,
  }));
}
