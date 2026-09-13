import type { Category } from '#/shared/infrastructure/db/schema.js';

import { Post } from '../Post.js';

export interface PostRepository {
  findById(id: string): Promise<Post | null>;
  findByGroupId(groupId: string, options?: { category?: Category }): Promise<Post[]>;
  save(post: Post): Promise<void>;
}
