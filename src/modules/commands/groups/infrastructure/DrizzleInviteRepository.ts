import { eq } from 'drizzle-orm';

import { db } from '#/shared/infrastructure/db/client.js';
import { invites } from '#/shared/infrastructure/db/schema.js';

import { Invite } from '../domain/Invite.js';
import type { InviteRepository } from '../domain/ports/InviteRepository.js';

export class DrizzleInviteRepository implements InviteRepository {
  async findByCode(code: string): Promise<Invite | null> {
    const [row] = await db.select().from(invites).where(eq(invites.code, code)).limit(1);
    return row ? Invite.reconstitute(row) : null;
  }

  async save(invite: Invite): Promise<void> {
    await db
      .insert(invites)
      .values({
        id: invite.id,
        code: invite.code,
        groupId: invite.groupId,
        expiresAt: invite.expiresAt,
        usageCount: invite.usageCount,
        maxUses: invite.maxUses,
        createdById: invite.createdById,
        createdAt: invite.createdAt,
      })
      .onConflictDoUpdate({
        target: invites.id,
        set: {
          usageCount: invite.usageCount,
          expiresAt: invite.expiresAt,
        },
      });
  }
}
