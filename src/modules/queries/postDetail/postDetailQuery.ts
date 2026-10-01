import { eq, and, isNull, sql } from 'drizzle-orm';
import { db } from '#/shared/infrastructure/db/client.js';
import { posts, memberships, users, postReactions, replies } from '#/shared/infrastructure/db/schema.js';
import type { ReactionType } from '#/shared/infrastructure/db/schema.js';
import { resolveIdentities } from '../shared/userIdentity.js';
import { buildPostCardRM, type PostCardRM } from '../shared/postCardQuery.js';

export type ReplyNodeDto = {
  id: string;
  postId: string;
  authorId: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  content: string;
  parentId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  children: ReplyNodeDto[];
  depth: number;
};

export type PostDetailRM = {
  post: PostCardRM;
  replies: ReplyNodeDto[];
};

export async function getPostDetail(
  postId: string,
  userId: string,
): Promise<PostDetailRM> {
  const [postRow] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!postRow) throw new Error('Post not found');

  const [membership] = await db
    .select()
    .from(memberships)
    .where(and(eq(memberships.userId, userId), eq(memberships.groupId, postRow.groupId)))
    .limit(1);
  if (!membership) throw new Error('Not a member of this group');

  const groupId = postRow.groupId;

  const [authorDisplayNameRow, countRows, myReactionRows, replyCountRows] = await Promise.all([
    db
      .select({
        displayName: memberships.displayName,
        avatarUrl: memberships.avatarUrl,
        email: users.email,
      })
      .from(memberships)
      .leftJoin(users, eq(users.id, postRow.authorId))
      .where(and(eq(memberships.userId, postRow.authorId), eq(memberships.groupId, groupId)))
      .limit(1),
    db
      .select({
        postId: postReactions.postId,
        type: postReactions.type,
        count: sql`count(*)`.as('count'),
      })
      .from(postReactions)
      .where(eq(postReactions.postId, postId))
      .groupBy(postReactions.postId, postReactions.type),
    db
      .select({ type: postReactions.type })
      .from(postReactions)
      .where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId))),
    db
      .select({ count: sql`count(*)`.as('count') })
      .from(replies)
      .where(and(eq(replies.postId, postId), isNull(replies.deletedAt))),
  ]);

  const identityMap = await resolveIdentities([
    {
      userId: postRow.authorId,
      displayName: authorDisplayNameRow[0]?.displayName,
      email: authorDisplayNameRow[0]?.email,
      avatarUrl: authorDisplayNameRow[0]?.avatarUrl,
    },
  ]);

  const countsMap = new Map<ReactionType, number>();
  for (const row of countRows) {
    countsMap.set(row.type, Number(row.count));
  }

  const allTypes: ReactionType[] = ['interested', 'liked', 'not_liked', 'viewed'];
  const reactions = allTypes.map((type) => ({
    type,
    count: countsMap.get(type) ?? 0,
  }));

  const postCardRM = buildPostCardRM(
    {
      id: postRow.id,
      groupId: postRow.groupId,
      authorId: postRow.authorId,
      category: postRow.category,
      title: postRow.title,
      description: postRow.description,
      externalUrl: postRow.externalUrl,
      previewImageUrl: postRow.previewImageUrl,
      previewEmbedHtml: postRow.previewEmbedHtml,
      rating: postRow.rating,
      createdAt: postRow.createdAt,
    },
    {
      displayName: identityMap.get(postRow.authorId)?.displayName ?? 'Anonymous',
      avatarUrl: identityMap.get(postRow.authorId)?.avatarUrl ?? null,
    },
    reactions,
    myReactionRows.map((r) => r.type),
    Number(replyCountRows[0]?.count ?? 0),
  );

  const replyRows = await db
    .select({
      id: replies.id,
      postId: replies.postId,
      authorId: replies.authorId,
      content: replies.content,
      parentId: replies.parentId,
      deletedAt: replies.deletedAt,
      createdAt: replies.createdAt,
      displayName: memberships.displayName,
      avatarUrl: memberships.avatarUrl,
      email: users.email,
    })
    .from(replies)
    .leftJoin(
      memberships,
      and(eq(memberships.userId, replies.authorId), eq(memberships.groupId, groupId)),
    )
    .leftJoin(users, eq(users.id, replies.authorId))
    .where(eq(replies.postId, postId))
    .orderBy(replies.createdAt);

  const replyIdentityMap = await resolveIdentities(
    replyRows.map((r) => ({
      userId: r.authorId,
      displayName: r.displayName,
      email: r.email,
      avatarUrl: r.avatarUrl,
    })),
  );

  const dtoMap = new Map<string, ReplyNodeDto>();
  for (const row of replyRows) {
    dtoMap.set(row.id, {
      id: row.id,
      postId: row.postId,
      authorId: row.authorId,
      authorDisplayName: replyIdentityMap.get(row.authorId)?.displayName ?? 'Anonymous',
      authorAvatarUrl: replyIdentityMap.get(row.authorId)?.avatarUrl ?? null,
      content: row.content,
      parentId: row.parentId,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      children: [],
      depth: 0,
    });
  }

  const roots: ReplyNodeDto[] = [];
  for (const dto of dtoMap.values()) {
    if (dto.parentId) {
      const parent = dtoMap.get(dto.parentId);
      if (parent) parent.children.push(dto);
      else roots.push(dto);
    } else {
      roots.push(dto);
    }
  }

  function assignDepth(node: ReplyNodeDto, depth: number): void {
    if (depth > 100) return;
    node.depth = depth;
    for (const child of node.children) assignDepth(child, depth + 1);
  }
  for (const root of roots) assignDepth(root, 0);

  return { post: postCardRM, replies: roots };
}
