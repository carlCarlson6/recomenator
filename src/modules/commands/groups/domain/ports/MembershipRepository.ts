import { Membership } from '../Membership.js';

export interface MembershipRepository {
  findByUserAndGroup(userId: string, groupId: string): Promise<Membership | null>;
  save(membership: Membership): Promise<void>;
}
