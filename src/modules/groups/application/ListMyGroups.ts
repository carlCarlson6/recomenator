import type { GroupRepository } from '../domain/ports/GroupRepository.js';
import type { MembershipRepository } from '../domain/ports/MembershipRepository.js';

export type GroupWithMembershipDto = {
  id: string;
  name: string;
  createdById: string;
  createdAt: Date;
  membershipId: string;
  displayName: string;
  role: 'owner' | 'member';
  lastReadAt: Date;
};

export async function listMyGroups(
  input: { userId: string },
  deps: { membershipRepo: MembershipRepository; groupRepo: GroupRepository },
): Promise<GroupWithMembershipDto[]> {
  const rows = await deps.membershipRepo.findByUserId(input.userId);

  return rows.map((row) => ({
    id: row.group.id,
    name: row.group.name,
    createdById: row.group.createdById,
    createdAt: row.group.createdAt,
    membershipId: row.membership.id,
    displayName: row.membership.displayName,
    role: row.membership.role,
    lastReadAt: row.membership.lastReadAt,
  }));
}
