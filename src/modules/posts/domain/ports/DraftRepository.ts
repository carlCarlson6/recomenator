import { Draft } from '../Draft.js';

export interface DraftRepository {
  findById(id: string): Promise<Draft | null>;
  findByGroupIdAndAuthorId(groupId: string, authorId: string): Promise<Draft[]>;
  save(draft: Draft): Promise<void>;
  deleteByIdAndAuthorId(id: string, authorId: string): Promise<void>;
}
