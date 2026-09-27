import { ok, type Result } from '#/shared/kernel/Result.js';
import { ValidationError } from '#/shared/kernel/DomainError.js';

import { Group } from '../domain/Group.js';
import { Membership } from '../domain/Membership.js';
import type { GroupRepository } from '../domain/ports/GroupRepository.js';
import type { MembershipRepository } from '../domain/ports/MembershipRepository.js';

export type CreateGroupInput = {
  name: string;
  ownerId: string;
  ownerDisplayName: string;
};

export type GroupDto = {
  id: string;
  name: string;
  createdById: string;
  createdAt: Date;
};

function toDto(group: Group): GroupDto {
  return {
    id: group.id,
    name: group.name,
    createdById: group.createdById,
    createdAt: group.createdAt,
  };
}

export async function createGroup(
  input: CreateGroupInput,
  deps: { groupRepo: GroupRepository; membershipRepo: MembershipRepository },
): Promise<Result<GroupDto, ValidationError>> {
  const groupResult = Group.create({ name: input.name, createdById: input.ownerId });
  if (!groupResult.ok) return groupResult;

  const membershipResult = Membership.create({
    userId: input.ownerId,
    groupId: groupResult.value.id,
    displayName: input.ownerDisplayName,
    role: 'owner',
  });
  if (!membershipResult.ok) return membershipResult;

  await deps.groupRepo.save(groupResult.value);
  await deps.membershipRepo.save(membershipResult.value);

  return ok(toDto(groupResult.value));
}
