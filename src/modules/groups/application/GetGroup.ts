import { err, ok, type Result } from '#/shared/kernel/Result.js';
import type { DomainError } from '#/shared/kernel/DomainError.js';

import { Group } from '../domain/Group.js';
import { GroupNotFoundError, NotGroupMemberError } from '../domain/errors.js';
import type { GroupRepository } from '../domain/ports/GroupRepository.js';
import type { MembershipRepository } from '../domain/ports/MembershipRepository.js';

export type GetGroupInput = {
  groupId: string;
  userId: string;
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

export async function getGroup(
  input: GetGroupInput,
  deps: { groupRepo: GroupRepository; membershipRepo: MembershipRepository },
): Promise<Result<GroupDto, DomainError>> {
  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, input.groupId);
  if (!membership) return err(new NotGroupMemberError());

  const group = await deps.groupRepo.findById(input.groupId);
  if (!group) return err(new GroupNotFoundError());

  return ok(toDto(group));
}

export async function updateDisplayName(
  input: { groupId: string; userId: string; displayName: string },
  deps: { membershipRepo: MembershipRepository },
): Promise<Result<
  { id: string; displayName: string; groupId: string },
  DomainError
>> {
  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, input.groupId);
  if (!membership) return err(new NotGroupMemberError());

  const updated = membership.updateDisplayName(input.displayName);
  if (!updated.ok) return updated;

  await deps.membershipRepo.save(updated.value);

  return ok({
    id: updated.value.id,
    displayName: updated.value.displayName,
    groupId: updated.value.groupId,
  });
}
