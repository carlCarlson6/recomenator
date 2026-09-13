import { asc, eq } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import { replies } from '#/shared/infrastructure/db/schema.js';

import { Reply } from '../domain/Reply.js';
import type { ReplyRepository } from '../domain/ports/ReplyRepository.js';

export class DrizzleReplyRepository implements ReplyRepository {
  async findByPostId(postId: string): Promise<Reply[]> {
    const rows = await db
      .select()
      .from(replies)
      .where(eq(replies.postId, postId))
      .orderBy(asc(replies.createdAt));
    return rows.map(Reply.reconstitute);
  }

  async save(reply: Reply): Promise<void> {
    await db.insert(replies).values({
      id: reply.id,
      postId: reply.postId,
      authorId: reply.authorId,
      content: reply.content,
      createdAt: reply.createdAt,
    });
  }
}
