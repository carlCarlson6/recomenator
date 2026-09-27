import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { DomainError } from '#/shared/kernel/DomainError.js';

import { NotGroupMemberError } from '#/modules/groups/domain/errors.js';
import type { MembershipRepository } from '#/modules/groups/domain/ports/MembershipRepository.js';
import type { UserRepository } from '#/modules/auth/domain/ports/UserRepository.js';
import {
  resyncUsers,
  type ResyncUserFromClerk,
} from '#/modules/auth/application/ResyncUserFromClerk.js';
import type { ReactionType } from '#/shared/infrastructure/db/schema.js';

import type { PostRepository } from '../domain/ports/PostRepository.js';
import type { PostReactionRepository } from '../domain/ports/PostReactionRepository.js';

class PostNotFoundError extends DomainError {
  readonly code = 'POST_NOT_FOUND';
  constructor() {
    super('Post not found');
  }
}

export type ReactorDto = {
  userId: string;
  displayName: string;
  reactedAt: Date;
};

export type ListPostReactorsOutput = {
  reactors: ReactorDto[];
};

export async function listPostReactors(
  input: { postId: string; userId: string; type: ReactionType },
  deps: {
    postRepo: PostRepository;
    membershipRepo: MembershipRepository;
    postReactionRepo: PostReactionRepository;
    userRepo: UserRepository;
    resyncUserFromClerk: ResyncUserFromClerk;
  },
): Promise<Result<ListPostReactorsOutput, DomainError>> {
  const post = await deps.postRepo.findById(input.postId);
  if (!post) return err(new PostNotFoundError());

  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, post.groupId);
  if (!membership) return err(new NotGroupMemberError());

  const reactions = await deps.postReactionRepo.findByPostIdAndType(input.postId, input.type);
  if (reactions.length === 0) {
    return ok({ reactors: [] });
  }

  const userIds = reactions.map((r) => r.userId);
  const users = await deps.userRepo.findByIds(userIds);
  const resyncedUsers = await resyncUsers(users, deps.resyncUserFromClerk);

  const displayNames = new Map(
    resyncedUsers.map((user) => [
      user.id,
      user.username?.trim() || user.email || 'Unknown',
    ]),
  );

  const reactors = reactions.map((reaction) => ({
    userId: reaction.userId,
    displayName: displayNames.get(reaction.userId) ?? 'Unknown',
    reactedAt: reaction.createdAt,
  }));

  return ok({ reactors });
}
