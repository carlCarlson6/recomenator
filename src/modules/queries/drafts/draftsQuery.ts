import { eq, and, desc } from 'drizzle-orm';
import { db } from '#/shared/infrastructure/db/client.js';
import { drafts } from '#/shared/infrastructure/db/schema.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';

export type DraftListRM = {
  id: string;
  groupId: string;
  category: Category;
  title: string | null;
  description: string | null;
  externalUrl: string | null;
  rating: number | null;
  updatedAt: Date;
};

export async function listDrafts(userId: string, groupId: string): Promise<DraftListRM[]> {
  const rows = await db
    .select()
    .from(drafts)
    .where(and(eq(drafts.authorId, userId), eq(drafts.groupId, groupId)))
    .orderBy(desc(drafts.updatedAt));

  return rows.map((r) => ({
    id: r.id,
    groupId: r.groupId,
    category: r.category,
    title: r.title,
    description: r.description,
    externalUrl: r.externalUrl,
    rating: r.rating,
    updatedAt: r.updatedAt,
  }));
}
