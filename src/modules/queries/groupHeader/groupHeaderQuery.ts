import { eq } from 'drizzle-orm';
import { db } from '#/shared/infrastructure/db/client.js';
import { groups } from '#/shared/infrastructure/db/schema.js';

export type GroupHeaderRM = {
  id: string;
  name: string;
};

export async function getGroupHeader(groupId: string): Promise<GroupHeaderRM> {
  const [group] = await db.select().from(groups).where(eq(groups.id, groupId)).limit(1);
  if (!group) throw new Error('Group not found');
  return { id: group.id, name: group.name };
}
