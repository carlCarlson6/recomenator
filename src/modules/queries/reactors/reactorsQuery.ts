import { eq, and } from 'drizzle-orm';
import { db } from '#/shared/infrastructure/db/client.js';
import { postReactions, memberships, users } from '#/shared/infrastructure/db/schema.js';
import type { ReactionType } from '#/shared/infrastructure/db/schema.js';
import { resolveDisplayNames } from '../shared/userIdentity.js';

export type ReactorListRM = {
  userId: string;
  displayName: string;
  reactedAt: Date;
};

export async function listReactors(
  postId: string,
  groupId: string,
  type: ReactionType,
): Promise<ReactorListRM[]> {
  const rows = await db
    .select({
      userId: postReactions.userId,
      createdAt: postReactions.createdAt,
      displayName: memberships.displayName,
      email: users.email,
    })
    .from(postReactions)
    .leftJoin(
      memberships,
      and(eq(memberships.userId, postReactions.userId), eq(memberships.groupId, groupId)),
    )
    .leftJoin(users, eq(users.id, postReactions.userId))
    .where(and(eq(postReactions.postId, postId), eq(postReactions.type, type)))
    .orderBy(postReactions.createdAt);

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
    reactedAt: r.createdAt,
  }));
}
