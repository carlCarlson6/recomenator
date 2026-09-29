import { and, eq } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import { postReactions, type ReactionType } from '#/shared/infrastructure/db/schema.js';

import { PostReaction } from '../domain/PostReaction.js';
import type { PostReactionRepository } from '../domain/ports/PostReactionRepository.js';

export class DrizzlePostReactionRepository implements PostReactionRepository {
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
      .where(
        and(
          eq(postReactions.postId, postId),
          eq(postReactions.userId, userId),
          eq(postReactions.type, type),
        ),
      );
  }
}
