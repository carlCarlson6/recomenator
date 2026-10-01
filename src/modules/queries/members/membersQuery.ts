import { and, eq } from 'drizzle-orm';
import { db } from '#/shared/infrastructure/db/client.js';
import { memberships, users } from '#/shared/infrastructure/db/schema.js';
import { resolveDisplayNames } from '../shared/userIdentity.js';

export type GroupMemberRM = {
  userId: string;
  displayName: string;
};

export async function listGroupMembers(
  groupId: string,
  userId: string,
): Promise<GroupMemberRM[]> {
  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.groupId, groupId)))
    .limit(1);
  if (!membership) throw new Error('Not a member of this group');

  const rows = await db
    .select({
      userId: memberships.userId,
      displayName: memberships.displayName,
      email: users.email,
    })
    .from(memberships)
    .leftJoin(users, eq(users.id, memberships.userId))
    .where(eq(memberships.groupId, groupId))
    .orderBy(memberships.displayName);

  const displayNameMap = await resolveDisplayNames(
    rows.map((r) => ({
      userId: r.userId,
      displayName: r.displayName,
      email: r.email,
    })),
  );

  return rows.map((r) => ({
    userId: r.userId,
    displayName: displayNameMap.get(r.userId) ?? 'Anonymous',
  }));
}
