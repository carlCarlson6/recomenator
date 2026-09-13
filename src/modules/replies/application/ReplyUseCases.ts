import { err, ok, type Result } from '#/shared/kernel/Result.js';
import type { DomainError } from '#/shared/kernel/DomainError.js';

import { NotGroupMemberError } from '#/modules/groups/domain/errors.js';
import type { MembershipRepository } from '#/modules/groups/domain/ports/MembershipRepository.js';
import type { PostRepository } from '#/modules/posts/domain/ports/PostRepository.js';
import { PostNotFoundError } from '#/modules/posts/domain/errors.js';

import { Reply } from '../domain/Reply.js';
import type { ReplyRepository } from '../domain/ports/ReplyRepository.js';

export type ReplyDto = {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  createdAt: Date;
};

function toDto(reply: Reply): ReplyDto {
  return {
    id: reply.id,
    postId: reply.postId,
    authorId: reply.authorId,
    content: reply.content,
    createdAt: reply.createdAt,
  };
}

export async function addReply(
  input: { postId: string; authorId: string; content: string },
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

  const replyResult = Reply.create(input);
  if (!replyResult.ok) return replyResult;

  await deps.replyRepo.save(replyResult.value);
  return ok(toDto(replyResult.value));
}

export async function listReplies(
  input: { postId: string; userId: string },
  deps: {
    replyRepo: ReplyRepository;
    postRepo: PostRepository;
    membershipRepo: MembershipRepository;
  },
): Promise<Result<ReplyDto[], DomainError>> {
  const post = await deps.postRepo.findById(input.postId);
  if (!post) return err(new PostNotFoundError());

  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, post.groupId);
  if (!membership) return err(new NotGroupMemberError());

  const replies = await deps.replyRepo.findByPostId(input.postId);
  return ok(replies.map(toDto));
}
