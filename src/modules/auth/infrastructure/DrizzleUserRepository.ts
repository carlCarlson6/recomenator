import { eq, inArray } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import { users } from '#/shared/infrastructure/db/schema.js';

import { User } from '../domain/User.js';
import type { UserRepository } from '../domain/ports/UserRepository.js';

export class DrizzleUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return row
      ? User.reconstitute({
          id: row.id,
          email: row.email,
          username: row.username ?? null,
          avatarUrl: row.avatarUrl,
          createdAt: row.createdAt,
        })
      : null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const rows = await db.select().from(users).where(inArray(users.id, ids));
    return rows.map((row) =>
      User.reconstitute({
        id: row.id,
        email: row.email,
        username: row.username ?? null,
        avatarUrl: row.avatarUrl,
        createdAt: row.createdAt,
      }),
    );
  }

  async save(user: User): Promise<void> {
    await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          username: user.username,
          avatarUrl: user.avatarUrl,
        },
      });
  }
}
