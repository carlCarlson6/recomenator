import { err, ok, type Result } from '#/shared/kernel/Result.js';
import type { DomainError } from '#/shared/kernel/DomainError.js';

import { NotGroupMemberError } from '../domain/errors.js';
import type { MembershipRepository } from '../domain/ports/MembershipRepository.js';

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
