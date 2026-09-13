import type { Category, ReactionType } from '#/shared/infrastructure/db/schema.js';

import { PostReaction } from '../PostReaction.js';

export interface PostReactionRepository {
  findCountsByPostIds(postIds: string[]): Promise<Array<{ postId: string; type: ReactionType; count: number }>>;
  findByPostIdsAndUserId(postIds: string[], userId: string): Promise<PostReaction[]>;
  findByUserIdAndGroupId(input: {
    userId: string;
    groupId: string;
    categories?: Category[];
    types?: ReactionType[];
  }): Promise<Array<{ postId: string; type: ReactionType; createdAt: Date }>>;
  save(reaction: PostReaction): Promise<void>;
  delete(postId: string, userId: string, type: ReactionType): Promise<void>;
}
