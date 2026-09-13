import { err, ok, type Result } from '#/shared/kernel/Result.js';
import type { DomainError } from '#/shared/kernel/DomainError.js';

import { NotGroupMemberError } from '#/modules/groups/domain/errors.js';
import type { MembershipRepository } from '#/modules/groups/domain/ports/MembershipRepository.js';
import type { ReactionType } from '#/shared/infrastructure/db/schema.js';

import { PostReaction } from '../domain/PostReaction.js';
import type { PostRepository } from '../domain/ports/PostRepository.js';
import type { PostReactionRepository } from '../domain/ports/PostReactionRepository.js';
import { PostNotFoundError } from '../domain/errors.js';

export async function addPostReaction(
  input: { postId: string; userId: string; type: ReactionType },
  deps: {
    postRepo: PostRepository;
    membershipRepo: MembershipRepository;
    postReactionRepo: PostReactionRepository;
  },
): Promise<Result<void, DomainError>> {
  const post = await deps.postRepo.findById(input.postId);
  if (!post) return err(new PostNotFoundError());

  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, post.groupId);
  if (!membership) return err(new NotGroupMemberError());

  const reactionResult = PostReaction.create(input);
  if (!reactionResult.ok) return reactionResult;

  await deps.postReactionRepo.save(reactionResult.value);
  return ok(undefined);
}

export async function removePostReaction(
  input: { postId: string; userId: string; type: ReactionType },
  deps: {
    postRepo: PostRepository;
    membershipRepo: MembershipRepository;
    postReactionRepo: PostReactionRepository;
  },
): Promise<Result<void, DomainError>> {
  const post = await deps.postRepo.findById(input.postId);
  if (!post) return err(new PostNotFoundError());

  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, post.groupId);
  if (!membership) return err(new NotGroupMemberError());

  await deps.postReactionRepo.delete(input.postId, input.userId, input.type);
  return ok(undefined);
}
