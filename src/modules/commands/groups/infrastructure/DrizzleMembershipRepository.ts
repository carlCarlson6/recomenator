import { and, eq } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import { groups, memberships } from '#/shared/infrastructure/db/schema.js';

import { Group } from '../domain/Group.js';
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

  async findByUserId(userId: string): Promise<Array<{ membership: Membership; group: Group }>> {
    const rows = await db
      .select({ membership: memberships, group: groups })
      .from(memberships)
      .innerJoin(groups, eq(memberships.groupId, groups.id))
      .where(eq(memberships.userId, userId));

    return rows.map((row) => ({
      membership: Membership.reconstitute(row.membership),
      group: Group.reconstitute(row.group),
    }));
  }

  async findByGroupId(groupId: string): Promise<Membership[]> {
    const rows = await db.select().from(memberships).where(eq(memberships.groupId, groupId));
    return rows.map(Membership.reconstitute);
  }

  async save(membership: Membership): Promise<void> {
    await db
      .insert(memberships)
      .values({
        id: membership.id,
        userId: membership.userId,
        groupId: membership.groupId,
        displayName: membership.displayName,
        role: membership.role,
        lastReadAt: membership.lastReadAt,
        createdAt: membership.createdAt,
      })
      .onConflictDoUpdate({
        target: memberships.id,
        set: {
          displayName: membership.displayName,
          role: membership.role,
          lastReadAt: membership.lastReadAt,
        },
      });
  }
}
