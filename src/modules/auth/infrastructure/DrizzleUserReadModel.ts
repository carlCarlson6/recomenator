import { inArray } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import { users } from '#/shared/infrastructure/db/schema.js';
import type { UserReadModel } from '#/shared/read-models/UserReadModel.js';

export class DrizzleUserReadModel implements UserReadModel {
  async findDisplayNamesByIds(userIds: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();

    if (userIds.length === 0) {
      return result;
    }

    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
      })
      .from(users)
      .where(inArray(users.id, userIds));

    for (const row of rows) {
      const displayName = row.username?.trim() || row.email || 'Anonymous';
      result.set(row.id, displayName);
    }

    return result;
  }
}
