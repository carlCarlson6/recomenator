import { eq, and } from 'drizzle-orm';
import { db } from '#/shared/infrastructure/db/client.js';
import { postReactions, posts, memberships, users } from '#/shared/infrastructure/db/schema.js';
import type { ReactionType } from '#/shared/infrastructure/db/schema.js';
import { resolveIdentities } from '../shared/userIdentity.js';

export type ReactorListRM = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  reactedAt: Date;
};

export async function listReactors(
  postId: string,
  userId: string,
  type: ReactionType,
): Promise<ReactorListRM[]> {
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) throw new Error('Post not found');

  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.groupId, post.groupId)))
    .limit(1);
  if (!membership) throw new Error('Not a member of this group');

  const rows = await db
    .select({
      userId: postReactions.userId,
      createdAt: postReactions.createdAt,
      displayName: memberships.displayName,
      avatarUrl: memberships.avatarUrl,
      email: users.email,
    })
    .from(postReactions)
    .leftJoin(
      memberships,
      and(eq(memberships.userId, postReactions.userId), eq(memberships.groupId, post.groupId)),
    )
    .leftJoin(users, eq(users.id, postReactions.userId))
    .where(and(eq(postReactions.postId, postId), eq(postReactions.type, type)))
    .orderBy(postReactions.createdAt);

  const identityMap = await resolveIdentities(
    rows.map((r) => ({
      userId: r.userId,
      displayName: r.displayName,
      email: r.email,
      avatarUrl: r.avatarUrl,
    })),
  );

  return rows.map((r) => ({
    userId: r.userId,
    displayName: identityMap.get(r.userId)?.displayName ?? 'Anonymous',
    avatarUrl: identityMap.get(r.userId)?.avatarUrl ?? null,
    reactedAt: r.createdAt,
  }));
}
