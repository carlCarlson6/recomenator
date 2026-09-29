import { Post } from '../Post.js';

export interface PostRepository {
  findById(id: string): Promise<Post | null>;
  save(post: Post): Promise<void>;
  delete(id: string): Promise<void>;
}
