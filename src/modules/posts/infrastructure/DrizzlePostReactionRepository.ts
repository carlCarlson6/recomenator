import { and, eq, inArray, sql } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import {
  postReactions,
  posts,
  type Category,
  type ReactionType,
} from '#/shared/infrastructure/db/schema.js';

import { PostReaction } from '../domain/PostReaction.js';
import type { PostReactionRepository } from '../domain/ports/PostReactionRepository.js';

export class DrizzlePostReactionRepository implements PostReactionRepository {
  async findCountsByPostIds(postIds: string[]): Promise<Array<{ postId: string; type: ReactionType; count: number }>> {
    if (postIds.length === 0) return [];

    const rows = await db
      .select({
        postId: postReactions.postId,
        type: postReactions.type,
        count: sql<number>`count(*)::int`.as('count'),
      })
      .from(postReactions)
      .where(inArray(postReactions.postId, postIds))
      .groupBy(postReactions.postId, postReactions.type);

    return rows.map((row) => ({
      postId: row.postId,
      type: row.type as ReactionType,
      count: row.count,
    }));
  }

  async findByPostIdsAndUserId(postIds: string[], userId: string): Promise<PostReaction[]> {
    if (postIds.length === 0) return [];

    const rows = await db
      .select()
      .from(postReactions)
      .where(and(inArray(postReactions.postId, postIds), eq(postReactions.userId, userId)));

    return rows.map(PostReaction.reconstitute);
  }

  async findByUserIdAndGroupId(input: {
    userId: string;
    groupId: string;
    categories?: Category[];
    types?: ReactionType[];
  }): Promise<Array<{ postId: string; type: ReactionType; createdAt: Date }>> {
    const rows = await db
      .select({
        postId: postReactions.postId,
        type: postReactions.type,
        createdAt: postReactions.createdAt,
      })
      .from(postReactions)
      .innerJoin(posts, eq(postReactions.postId, posts.id))
      .where(
        and(
          eq(postReactions.userId, input.userId),
          eq(posts.groupId, input.groupId),
          input.categories && input.categories.length > 0
            ? inArray(posts.category, input.categories)
            : undefined,
          input.types && input.types.length > 0
            ? inArray(postReactions.type, input.types)
            : undefined,
        ),
      )
      .orderBy(sql`${postReactions.createdAt} desc`);

    return rows.map((row) => ({
      postId: row.postId,
      type: row.type as ReactionType,
      createdAt: row.createdAt,
    }));
  }

  async save(reaction: PostReaction): Promise<void> {
    await db
      .insert(postReactions)
      .values({
        id: reaction.id,
        postId: reaction.postId,
        userId: reaction.userId,
        type: reaction.type,
        createdAt: reaction.createdAt,
        updatedAt: reaction.updatedAt,
      })
      .onConflictDoNothing({
        target: [postReactions.postId, postReactions.userId, postReactions.type],
      });
  }

  async delete(postId: string, userId: string, type: ReactionType): Promise<void> {
    await db
      .delete(postReactions)
      .where(and(eq(postReactions.postId, postId), eq(postReactions.userId, userId), eq(postReactions.type, type)));
  }
}
