import { and, eq } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import { memberships } from '#/shared/infrastructure/db/schema.js';

import { Membership } from '../domain/Membership.js';
import type { MembershipRepository } from '../domain/ports/MembershipRepository.js';

export class DrizzleMembershipRepository implements MembershipRepository {
  async findByUserAndGroup(userId: string, groupId: string): Promise<Membership | null> {
    const [row] = await db
      .select()
      .from(memberships)
      .where(and(eq(memberships.userId, userId), eq(memberships.groupId, groupId)))
      .limit(1);
    return row ? Membership.reconstitute(row) : null;
  }

  async save(membership: Membership): Promise<void> {
    await db
      .insert(memberships)
      .values({
        id: membership.id,
        userId: membership.userId,
        groupId: membership.groupId,
        displayName: membership.displayName,
        avatarUrl: membership.avatarUrl,
        role: membership.role,
        createdAt: membership.createdAt,
      })
      .onConflictDoUpdate({
        target: memberships.id,
        set: {
          displayName: membership.displayName,
          avatarUrl: membership.avatarUrl,
          role: membership.role,
        },
      });
  }
}
