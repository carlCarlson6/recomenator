import { eq } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import { posts } from '#/shared/infrastructure/db/schema.js';

import { Post } from '../domain/Post.js';
import type { PostRepository } from '../domain/ports/PostRepository.js';

export class DrizzlePostRepository implements PostRepository {
  async findById(id: string): Promise<Post | null> {
    const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    return row ? Post.reconstitute(row) : null;
  }

  async save(post: Post): Promise<void> {
    await db
      .insert(posts)
      .values({
        id: post.id,
        groupId: post.groupId,
        authorId: post.authorId,
        category: post.category,
        title: post.title,
        description: post.description,
        externalUrl: post.externalUrl,
        previewImageUrl: post.previewImageUrl,
        previewEmbedHtml: post.previewEmbedHtml,
        rating: post.rating,
        createdAt: post.createdAt,
      })
      .onConflictDoUpdate({
        target: posts.id,
        set: {
          title: post.title,
          description: post.description,
          externalUrl: post.externalUrl,
          previewImageUrl: post.previewImageUrl,
          previewEmbedHtml: post.previewEmbedHtml,
          rating: post.rating,
        },
      });
  }

  async delete(id: string): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }
}
