import type { Category } from '#/shared/infrastructure/db/schema.js';

import { Post } from '../Post.js';

export interface PostRepository {
  findById(id: string): Promise<Post | null>;
  findByIds(ids: string[]): Promise<Post[]>;
  findByGroupId(groupId: string, options?: { category?: Category }): Promise<Post[]>;
  save(post: Post): Promise<void>;
  delete(id: string): Promise<void>;
}
