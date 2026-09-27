import { Invite } from '../Invite.js';

export interface InviteRepository {
  findByCode(code: string): Promise<Invite | null>;
  save(invite: Invite): Promise<void>;
}
