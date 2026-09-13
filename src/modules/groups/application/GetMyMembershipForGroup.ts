import { err, ok, type Result } from '#/shared/kernel/Result.js';
import type { DomainError } from '#/shared/kernel/DomainError.js';

import { GroupNotFoundError } from '../domain/errors.js';
import type { GroupRepository } from '../domain/ports/GroupRepository.js';
import type { MembershipRepository } from '../domain/ports/MembershipRepository.js';

export type GetMyMembershipForGroupInput = {
  groupId: string;
  userId: string;
};

export type MembershipPreviewDto = {
  id: string;
  userId: string;
  groupId: string;
  displayName: string;
  role: 'owner' | 'member';
  lastReadAt: Date;
};

export async function getMyMembershipForGroup(
  input: GetMyMembershipForGroupInput,
  deps: {
    membershipRepo: MembershipRepository;
    groupRepo: GroupRepository;
  },
): Promise<Result<MembershipPreviewDto | null, DomainError>> {
  const group = await deps.groupRepo.findById(input.groupId);
  if (!group) return err(new GroupNotFoundError());

  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, group.id);
  if (!membership) return ok(null);

  return ok({
    id: membership.id,
    userId: membership.userId,
    groupId: membership.groupId,
    displayName: membership.displayName,
    role: membership.role,
    lastReadAt: membership.lastReadAt,
  });
}
