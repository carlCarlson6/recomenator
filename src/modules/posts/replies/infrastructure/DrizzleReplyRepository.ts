import { asc, count, eq, inArray } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import { replies } from '#/shared/infrastructure/db/schema.js';

import { Reply } from '../domain/Reply.js';
import type { ReplyRepository } from '../domain/ports/ReplyRepository.js';

export class DrizzleReplyRepository implements ReplyRepository {
  async findById(id: string): Promise<Reply | null> {
    const [row] = await db.select().from(replies).where(eq(replies.id, id)).limit(1);
    return row ? Reply.reconstitute(row) : null;
  }

  async findByPostId(postId: string): Promise<Reply[]> {
    const rows = await db
      .select()
      .from(replies)
      .where(eq(replies.postId, postId))
      .orderBy(asc(replies.createdAt));
    return rows.map(Reply.reconstitute);
  }

  async countByPostIds(postIds: string[]): Promise<Array<{ postId: string; count: number }>> {
    if (postIds.length === 0) return [];

    const rows = await db
      .select({ postId: replies.postId, count: count() })
      .from(replies)
      .where(inArray(replies.postId, postIds))
      .groupBy(replies.postId);

    return rows.map((row) => ({ postId: row.postId, count: Number(row.count) }));
  }

  async save(reply: Reply): Promise<void> {
    await db
      .insert(replies)
      .values({
        id: reply.id,
        postId: reply.postId,
        authorId: reply.authorId,
        content: reply.content,
        parentId: reply.parentId,
        deletedAt: reply.deletedAt,
        createdAt: reply.createdAt,
      })
      .onConflictDoUpdate({
        target: replies.id,
        set: {
          parentId: reply.parentId,
          deletedAt: reply.deletedAt,
        },
      });
  }
}
