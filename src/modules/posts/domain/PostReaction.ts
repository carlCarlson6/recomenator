import { createId } from '#/shared/kernel/idGenerator.js';
import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { ValidationError } from '#/shared/kernel/DomainError.js';

import type { ReactionType } from '#/shared/infrastructure/db/schema.js';

const REACTION_TYPES: ReactionType[] = ['interested', 'liked', 'not_liked', 'viewed'];

export class PostReaction {
  private constructor(
    readonly id: string,
    readonly postId: string,
    readonly userId: string,
    readonly type: ReactionType,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(input: {
    postId: string;
    userId: string;
    type: ReactionType;
  }): Result<PostReaction, ValidationError> {
    if (!REACTION_TYPES.includes(input.type)) {
      return err(new ValidationError(`Invalid reaction type: ${input.type}`));
    }

    const now = new Date();
    return ok(
      new PostReaction(createId('rct'), input.postId, input.userId, input.type, now, now),
    );
  }

  static reconstitute(input: {
    id: string;
    postId: string;
    userId: string;
    type: ReactionType;
    createdAt: Date;
    updatedAt: Date;
  }): PostReaction {
    return new PostReaction(input.id, input.postId, input.userId, input.type, input.createdAt, input.updatedAt);
  }
}
