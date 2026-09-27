import { err, ok, type Result } from '#/shared/kernel/Result.js';
import type { DomainError } from '#/shared/kernel/DomainError.js';
import { ValidationError } from '#/shared/kernel/DomainError.js';

import {
  ExpiredInviteError,
  GroupNotFoundError,
  InviteNotFoundError,
} from '../domain/errors.js';
import { Membership } from '../domain/Membership.js';
import type { GroupRepository } from '../domain/ports/GroupRepository.js';
import type { InviteRepository } from '../domain/ports/InviteRepository.js';
import type { MembershipRepository } from '../domain/ports/MembershipRepository.js';

export type JoinGroupInput = {
  code: string;
  userId: string;
  displayName: string;
};

export type MembershipDto = {
  id: string;
  userId: string;
  groupId: string;
  displayName: string;
  role: 'owner' | 'member';
  lastReadAt: Date;
};

function toDto(membership: Membership): MembershipDto {
  return {
    id: membership.id,
    userId: membership.userId,
    groupId: membership.groupId,
    displayName: membership.displayName,
    role: membership.role,
    lastReadAt: membership.lastReadAt,
  };
}

export async function joinGroupWithInvite(
  input: JoinGroupInput,
  deps: {
    groupRepo: GroupRepository;
    inviteRepo: InviteRepository;
    membershipRepo: MembershipRepository;
  },
): Promise<Result<MembershipDto, DomainError | ValidationError>> {
  const invite = await deps.inviteRepo.findByCode(input.code);
  if (!invite) return err(new InviteNotFoundError());

  const valid = invite.validate();
  if (!valid.ok) return err(new ExpiredInviteError());

  const group = await deps.groupRepo.findById(invite.groupId);
  if (!group) return err(new GroupNotFoundError());

  const existing = await deps.membershipRepo.findByUserAndGroup(input.userId, group.id);
  if (existing) return ok(toDto(existing));

  const membershipResult = Membership.create({
    userId: input.userId,
    groupId: group.id,
    displayName: input.displayName,
  });
  if (!membershipResult.ok) return membershipResult;

  await deps.membershipRepo.save(membershipResult.value);
  await deps.inviteRepo.save(invite.markUsed());

  return ok(toDto(membershipResult.value));
}
