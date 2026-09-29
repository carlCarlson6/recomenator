import { and, eq } from 'drizzle-orm';
import { db } from '#/shared/infrastructure/db/client.js';
import { invites, groups, memberships } from '#/shared/infrastructure/db/schema.js';

export type InvitePageRM = {
  groupId: string;
  groupName: string;
  existingMembership: { id: string } | null;
};

export async function getInvitePageData(
  code: string,
  userId: string,
): Promise<InvitePageRM> {
  const [invite] = await db.select().from(invites).where(eq(invites.code, code)).limit(1);
  if (!invite) throw new Error('Invalid invite code');

  const [group] = await db.select().from(groups).where(eq(groups.id, invite.groupId)).limit(1);
  if (!group) throw new Error('Group not found');

  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.groupId, invite.groupId)))
    .limit(1);

  return {
    groupId: group.id,
    groupName: group.name,
    existingMembership: membership ? { id: membership.id } : null,
  };
}
