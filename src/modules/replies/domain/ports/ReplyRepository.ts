import { Reply } from '../Reply.js';

export interface ReplyRepository {
  findById(id: string): Promise<Reply | null>;
  findByPostId(postId: string): Promise<Reply[]>;
  countByPostIds(postIds: string[]): Promise<Array<{ postId: string; count: number }>>;
  save(reply: Reply): Promise<void>;
}
