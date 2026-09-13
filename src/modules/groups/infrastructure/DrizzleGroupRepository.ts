import { eq } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import { groups } from '#/shared/infrastructure/db/schema.js';

import { Group } from '../domain/Group.js';
import type { GroupRepository } from '../domain/ports/GroupRepository.js';

export class DrizzleGroupRepository implements GroupRepository {
  async findById(id: string): Promise<Group | null> {
    const [row] = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
    return row ? Group.reconstitute(row) : null;
  }

  async save(group: Group): Promise<void> {
    await db
      .insert(groups)
      .values({
        id: group.id,
        name: group.name,
        createdById: group.createdById,
        createdAt: group.createdAt,
      })
      .onConflictDoUpdate({
        target: groups.id,
        set: { name: group.name },
      });
  }
}
