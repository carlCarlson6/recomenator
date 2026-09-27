import { and, desc, eq } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import { drafts, type Category } from '#/shared/infrastructure/db/schema.js';

import { Draft } from '../domain/Draft.js';
import type { DraftRepository } from '../domain/ports/DraftRepository.js';

export class DrizzleDraftRepository implements DraftRepository {
  async findById(id: string): Promise<Draft | null> {
    const [row] = await db.select().from(drafts).where(eq(drafts.id, id)).limit(1);
    return row ? this.toDomain(row) : null;
  }

  async findByGroupIdAndAuthorId(groupId: string, authorId: string): Promise<Draft[]> {
    const rows = await db
      .select()
      .from(drafts)
      .where(and(eq(drafts.groupId, groupId), eq(drafts.authorId, authorId)))
      .orderBy(desc(drafts.updatedAt));
    return rows.map((row) => this.toDomain(row));
  }

  async save(draft: Draft): Promise<void> {
    await db
      .insert(drafts)
      .values({
        id: draft.id,
        groupId: draft.groupId,
        authorId: draft.authorId,
        category: draft.category,
        title: draft.title,
        description: draft.description,
        externalUrl: draft.externalUrl,
        rating: draft.rating,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt,
      })
      .onConflictDoUpdate({
        target: drafts.id,
        set: {
          category: draft.category,
          title: draft.title,
          description: draft.description,
          externalUrl: draft.externalUrl,
          rating: draft.rating,
          updatedAt: draft.updatedAt,
        },
      });
  }

  async deleteByIdAndAuthorId(id: string, authorId: string): Promise<void> {
    await db.delete(drafts).where(and(eq(drafts.id, id), eq(drafts.authorId, authorId)));
  }

  private toDomain(row: {
    id: string;
    groupId: string;
    authorId: string;
    category: string;
    title: string | null;
    description: string | null;
    externalUrl: string | null;
    rating: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): Draft {
    return Draft.reconstitute({
      id: row.id,
      groupId: row.groupId,
      authorId: row.authorId,
      category: row.category as Category,
      title: row.title,
      description: row.description,
      externalUrl: row.externalUrl,
      rating: row.rating,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
