import { err, ok, type Result } from '#/shared/kernel/Result.js';
import type { DomainError } from '#/shared/kernel/DomainError.js';

import { Invite } from '../domain/Invite.js';
import {
  GroupNotFoundError,
  NotGroupMemberError,
  UnauthorizedToManageGroupError,
} from '../domain/errors.js';
import type { GroupRepository } from '../domain/ports/GroupRepository.js';
import type { InviteRepository } from '../domain/ports/InviteRepository.js';
import type { MembershipRepository } from '../domain/ports/MembershipRepository.js';

export type GenerateInviteInput = {
  groupId: string;
  userId: string;
};

export type InviteDto = {
  id: string;
  code: string;
  groupId: string;
  expiresAt: Date;
  usageCount: number;
  maxUses: number | null;
};

function toDto(invite: Invite): InviteDto {
  return {
    id: invite.id,
    code: invite.code,
    groupId: invite.groupId,
    expiresAt: invite.expiresAt,
    usageCount: invite.usageCount,
    maxUses: invite.maxUses,
  };
}

export async function generateInvite(
  input: GenerateInviteInput,
  deps: {
    groupRepo: GroupRepository;
    inviteRepo: InviteRepository;
    membershipRepo: MembershipRepository;
  },
): Promise<Result<InviteDto, DomainError>> {
  const group = await deps.groupRepo.findById(input.groupId);
  if (!group) return err(new GroupNotFoundError());

  if (!group.isManagedBy(input.userId)) {
    return err(new UnauthorizedToManageGroupError());
  }

  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, input.groupId);
  if (!membership) return err(new NotGroupMemberError());

  const invite = Invite.create({ groupId: group.id, createdById: input.userId });
  await deps.inviteRepo.save(invite);

  return ok(toDto(invite));
}
