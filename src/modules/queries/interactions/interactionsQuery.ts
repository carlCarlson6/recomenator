import { eq, and, inArray, isNull, sql } from 'drizzle-orm';
import { db } from '#/shared/infrastructure/db/client.js';
import { posts, memberships, users, postReactions, replies, groups } from '#/shared/infrastructure/db/schema.js';
import type { Category, ReactionType } from '#/shared/infrastructure/db/schema.js';
import { resolveDisplayNames } from '../shared/userIdentity.js';
import { buildPostCardRM, type PostCardRM } from '../shared/postCardQuery.js';

export type InteractionsRM = {
  groupId: string;
  groupName: string;
  posts: PostCardRM[];
};

export async function getInteractions(
  groupId: string,
  userId: string,
  categories?: Category[],
  types?: ReactionType[],
): Promise<InteractionsRM> {
  const membership = await db.query.memberships.findFirst({
    where: and(eq(memberships.userId, userId), eq(memberships.groupId, groupId)),
  });
  if (!membership) throw new Error('Not a member of this group');

  const group = await db.query.groups.findFirst({
    where: eq(groups.id, groupId),
  });
  if (!group) throw new Error('Group not found');

  const reactionRows = await db
    .select({
      postId: postReactions.postId,
      createdAt: postReactions.createdAt,
    })
    .from(postReactions)
    .innerJoin(posts, eq(posts.id, postReactions.postId))
    .where(
      and(
        eq(postReactions.userId, userId),
        eq(posts.groupId, groupId),
        categories && categories.length > 0 ? inArray(posts.category, categories) : undefined,
        types && types.length > 0 ? inArray(postReactions.type, types) : undefined,
      ),
    );

  if (reactionRows.length === 0) {
    return { groupId, groupName: group.name, posts: [] };
  }

  const lastReactedAtMap = new Map<string, Date>();
  for (const row of reactionRows) {
    const existing = lastReactedAtMap.get(row.postId);
    if (!existing || row.createdAt.getTime() > existing.getTime()) {
      lastReactedAtMap.set(row.postId, row.createdAt);
    }
  }

  const postIds = [...lastReactedAtMap.keys()];

  const postRows = await db
    .select({
      id: posts.id,
      groupId: posts.groupId,
      authorId: posts.authorId,
      category: posts.category,
      title: posts.title,
      description: posts.description,
      externalUrl: posts.externalUrl,
      previewImageUrl: posts.previewImageUrl,
      previewEmbedHtml: posts.previewEmbedHtml,
      rating: posts.rating,
      createdAt: posts.createdAt,
      authorDisplayName: memberships.displayName,
      authorEmail: users.email,
    })
    .from(posts)
    .leftJoin(
      memberships,
      and(eq(memberships.userId, posts.authorId), eq(memberships.groupId, posts.groupId)),
    )
    .leftJoin(users, eq(users.id, posts.authorId))
    .where(inArray(posts.id, postIds));

  const [countRows, myReactionRows, replyCountRows] = await Promise.all([
    db
      .select({
        postId: postReactions.postId,
        type: postReactions.type,
        count: sql`count(*)`.as('count'),
      })
      .from(postReactions)
      .where(inArray(postReactions.postId, postIds))
      .groupBy(postReactions.postId, postReactions.type),
    db
      .select({
        postId: postReactions.postId,
        type: postReactions.type,
      })
      .from(postReactions)
      .where(and(inArray(postReactions.postId, postIds), eq(postReactions.userId, userId))),
    db
      .select({
        postId: replies.postId,
        count: sql`count(*)`.as('count'),
      })
      .from(replies)
      .where(and(inArray(replies.postId, postIds), isNull(replies.deletedAt)))
      .groupBy(replies.postId),
  ]);

  const displayNameMap = await resolveDisplayNames(
    postRows.map((p) => ({
      userId: p.authorId,
      displayName: p.authorDisplayName,
      email: p.authorEmail,
    })),
  );

  const countsMap = new Map<string, Map<ReactionType, number>>();
  for (const row of countRows) {
    if (!countsMap.has(row.postId)) countsMap.set(row.postId, new Map());
    countsMap.get(row.postId)!.set(row.type, Number(row.count));
  }

  const myReactionsMap = new Map<string, ReactionType[]>();
  for (const row of myReactionRows) {
    if (!myReactionsMap.has(row.postId)) myReactionsMap.set(row.postId, []);
    myReactionsMap.get(row.postId)!.push(row.type);
  }

  const replyCountMap = new Map(replyCountRows.map((r) => [r.postId, Number(r.count)]));

  const allTypes: ReactionType[] = ['interested', 'liked', 'not_liked', 'viewed'];

  const postCardRMs = postRows
    .map((row) => {
      const postCounts = countsMap.get(row.id) ?? new Map();
      const reactions = allTypes.map((type) => ({
        type,
        count: postCounts.get(type) ?? 0,
      }));
      return buildPostCardRM(
        {
          id: row.id,
          groupId: row.groupId,
          authorId: row.authorId,
          category: row.category,
          title: row.title,
          description: row.description,
          externalUrl: row.externalUrl,
          previewImageUrl: row.previewImageUrl,
          previewEmbedHtml: row.previewEmbedHtml,
          rating: row.rating,
          createdAt: row.createdAt,
        },
        displayNameMap.get(row.authorId) ?? 'Anonymous',
        reactions,
        myReactionsMap.get(row.id) ?? [],
        replyCountMap.get(row.id) ?? 0,
      );
    })
    .sort((a, b) => {
      const aTime = lastReactedAtMap.get(a.id)!.getTime();
      const bTime = lastReactedAtMap.get(b.id)!.getTime();
      return bTime - aTime;
    });

  return { groupId, groupName: group.name, posts: postCardRMs };
}
