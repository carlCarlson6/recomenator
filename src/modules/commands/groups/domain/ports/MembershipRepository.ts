import type { Group } from '../Group.js';
import { Membership } from '../Membership.js';

export interface MembershipRepository {
  findByUserAndGroup(userId: string, groupId: string): Promise<Membership | null>;
  findByUserId(userId: string): Promise<Array<{ membership: Membership; group: Group }>>;
  findByGroupId(groupId: string): Promise<Membership[]>;
  save(membership: Membership): Promise<void>;
}
