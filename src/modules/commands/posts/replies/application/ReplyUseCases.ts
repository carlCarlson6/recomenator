import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { UnauthorizedError, type DomainError } from '#/shared/kernel/DomainError.js';

import { NotGroupMemberError } from '#/modules/commands/groups/domain/errors.js';
import type { MembershipRepository } from '#/modules/commands/groups/domain/ports/MembershipRepository.js';
import type { PostRepository } from '../../domain/ports/PostRepository.js';
import { PostNotFoundError } from '../../domain/errors.js';

import { Reply } from '../domain/Reply.js';
import { ReplyNotFoundError, ReplyPostMismatchError, ReplyToDeletedReplyError } from '../domain/errors.js';
import type { ReplyRepository } from '../domain/ports/ReplyRepository.js';

export type ReplyDto = {
  id: string;
  postId: string;
  authorId: string;
  authorDisplayName: string;
  content: string;
  parentId: string | null;
  deletedAt: Date | null;
  createdAt: Date;
};

function toDto(reply: Reply, authorDisplayName: string): ReplyDto {
  return {
    id: reply.id,
    postId: reply.postId,
    authorId: reply.authorId,
    authorDisplayName,
    content: reply.content,
    parentId: reply.parentId,
    deletedAt: reply.deletedAt,
    createdAt: reply.createdAt,
  };
}

export async function addReply(
  input: { postId: string; authorId: string; content: string; parentId?: string },
  deps: {
    replyRepo: ReplyRepository;
    postRepo: PostRepository;
    membershipRepo: MembershipRepository;
  },
): Promise<Result<ReplyDto, DomainError>> {
  const post = await deps.postRepo.findById(input.postId);
  if (!post) return err(new PostNotFoundError());

  const membership = await deps.membershipRepo.findByUserAndGroup(input.authorId, post.groupId);
  if (!membership) return err(new NotGroupMemberError());

  if (input.parentId) {
    const parent = await deps.replyRepo.findById(input.parentId);
    if (!parent) return err(new ReplyNotFoundError());
    if (parent.deletedAt) return err(new ReplyToDeletedReplyError());
    if (parent.postId !== input.postId) return err(new ReplyPostMismatchError());
  }

  const replyResult = Reply.create({
    postId: input.postId,
    authorId: input.authorId,
    content: input.content,
    parentId: input.parentId,
  });
  if (!replyResult.ok) return replyResult;

  await deps.replyRepo.save(replyResult.value);

  return ok(toDto(replyResult.value, membership.displayName));
}

export async function deleteReply(
  input: { replyId: string; userId: string },
  deps: {
    replyRepo: ReplyRepository;
  },
): Promise<Result<void, DomainError>> {
  const reply = await deps.replyRepo.findById(input.replyId);
  if (!reply) return err(new ReplyNotFoundError());

  if (reply.authorId !== input.userId) {
    return err(new UnauthorizedError('Reply does not belong to user'));
  }

  await deps.replyRepo.save(reply.delete());
  return ok(undefined);
}
