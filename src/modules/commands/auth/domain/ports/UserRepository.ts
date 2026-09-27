import { User } from '../User.js';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByIds(ids: string[]): Promise<User[]>;
  save(user: User): Promise<void>;
}
