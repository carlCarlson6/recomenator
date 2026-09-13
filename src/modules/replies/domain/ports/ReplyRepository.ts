import { Reply } from '../Reply.js';

export interface ReplyRepository {
  findByPostId(postId: string): Promise<Reply[]>;
  countByPostIds(postIds: string[]): Promise<Array<{ postId: string; count: number }>>;
  save(reply: Reply): Promise<void>;
}
