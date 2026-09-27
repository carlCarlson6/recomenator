import { eq, and, count, gt } from 'drizzle-orm';
import { db } from '#/shared/infrastructure/db/client.js';
import { groups, memberships, posts, replies } from '#/shared/infrastructure/db/schema.js';

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
      groupId: memberships.groupId,
      count: count(replies.id),
    })
    .from(memberships)
    .innerJoin(posts, eq(posts.groupId, memberships.groupId))
    .innerJoin(replies, eq(replies.postId, posts.id))
    .where(and(eq(memberships.userId, userId), gt(replies.createdAt, memberships.lastReadAt)))
    .groupBy(memberships.groupId);

  const unreadMap = new Map(unreadRows.map((r) => [r.groupId, Number(r.count)]));

  return groupRows.map((r) => ({
    id: r.id,
    name: r.name,
    displayName: r.displayName,
    role: r.role as 'owner' | 'member',
    unreadCount: unreadMap.get(r.id) ?? 0,
  }));
}
