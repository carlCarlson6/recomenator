import { eq } from 'drizzle-orm';
import { db } from '#/shared/infrastructure/db/client.js';
import { invites, groups } from '#/shared/infrastructure/db/schema.js';

export type InvitePageRM = {
  groupId: string;
  groupName: string;
  existingMembership: { id: string } | null;
};

export async function getInvitePageData(
  code: string,
  userId: string,
): Promise<InvitePageRM> {
  const invite = await db.query.invites.findFirst({
    where: eq(invites.code, code),
  });
  if (!invite) throw new Error('Invalid invite code');

  const group = await db.query.groups.findFirst({
    where: eq(groups.id, invite.groupId),
  });
  if (!group) throw new Error('Group not found');

  const membership = await db.query.memberships.findFirst({
    where: (m) => eq(m.userId, userId) && eq(m.groupId, invite.groupId),
  });

  return {
    groupId: group.id,
    groupName: group.name,
    existingMembership: membership ? { id: membership.id } : null,
  };
}
