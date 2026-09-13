import { and, desc, eq, inArray } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import { posts, type Category } from '#/shared/infrastructure/db/schema.js';

import { Post } from '../domain/Post.js';
import type { PostRepository } from '../domain/ports/PostRepository.js';

export class DrizzlePostRepository implements PostRepository {
  async findById(id: string): Promise<Post | null> {
    const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
    return row ? Post.reconstitute(row) : null;
  }

  async findByIds(ids: string[]): Promise<Post[]> {
    if (ids.length === 0) return [];

    const rows = await db.select().from(posts).where(inArray(posts.id, ids));
    return rows.map(Post.reconstitute);
  }

  async findByGroupId(groupId: string, options?: { category?: Category }): Promise<Post[]> {
    const rows = await db
      .select()
      .from(posts)
      .where(
        and(
          eq(posts.groupId, groupId),
          options?.category ? eq(posts.category, options.category) : undefined,
        ),
      )
      .orderBy(desc(posts.createdAt));
    return rows.map(Post.reconstitute);
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
}
