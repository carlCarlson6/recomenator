import { Reply } from '../Reply.js';

export interface ReplyRepository {
  findByPostId(postId: string): Promise<Reply[]>;
  save(reply: Reply): Promise<void>;
}
