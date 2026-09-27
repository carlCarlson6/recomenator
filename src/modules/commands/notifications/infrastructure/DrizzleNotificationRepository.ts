import { and, count, eq, gt, sql } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import { memberships, posts, replies } from '#/shared/infrastructure/db/schema.js';

export class DrizzleNotificationRepository {
  async countUnreadRepliesByGroup(userId: string): Promise<Array<{ groupId: string; count: number }>> {
    const rows = await db
      .select({
        groupId: memberships.groupId,
        count: count(replies.id).as('count'),
      })
      .from(memberships)
      .innerJoin(posts, eq(posts.groupId, memberships.groupId))
      .innerJoin(replies, eq(replies.postId, posts.id))
      .where(and(eq(memberships.userId, userId), gt(replies.createdAt, memberships.lastReadAt)))
      .groupBy(memberships.groupId);

    return rows.map((row) => ({ groupId: row.groupId, count: Number(row.count) }));
  }

  async markGroupAsRead(userId: string, groupId: string): Promise<void> {
    await db
      .update(memberships)
      .set({ lastReadAt: sql`now()` })
      .where(and(eq(memberships.userId, userId), eq(memberships.groupId, groupId)));
  }
}
