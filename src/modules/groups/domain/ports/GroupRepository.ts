import { Group } from '../Group.js';

export interface GroupRepository {
  findById(id: string): Promise<Group | null>;
  save(group: Group): Promise<void>;
}
