import { Reply } from '../Reply.js';

export interface ReplyRepository {
  findById(id: string): Promise<Reply | null>;
  save(reply: Reply): Promise<void>;
}
