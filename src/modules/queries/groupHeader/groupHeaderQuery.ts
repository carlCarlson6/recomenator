import { and, eq } from 'drizzle-orm';
import { db } from '#/shared/infrastructure/db/client.js';
import { groups, memberships } from '#/shared/infrastructure/db/schema.js';

export type GroupHeaderRM = {
  id: string;
  name: string;
  displayName: string;
};

export async function getGroupHeader(
  groupId: string,
  userId: string,
): Promise<GroupHeaderRM> {
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!group) throw new Error('Group not found');

  const [membership] = await db
    .select({ displayName: memberships.displayName })
    .from(memberships)
    .where(and(eq(memberships.groupId, groupId), eq(memberships.userId, userId)))
    .limit(1);

  return { id: group.id, name: group.name, displayName: membership?.displayName ?? '' };
}
