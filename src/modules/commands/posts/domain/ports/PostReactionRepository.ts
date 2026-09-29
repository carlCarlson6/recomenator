import type { ReactionType } from '#/shared/infrastructure/db/schema.js';

import { PostReaction } from '../PostReaction.js';

export interface PostReactionRepository {
  save(reaction: PostReaction): Promise<void>;
  delete(postId: string, userId: string, type: ReactionType): Promise<void>;
}
