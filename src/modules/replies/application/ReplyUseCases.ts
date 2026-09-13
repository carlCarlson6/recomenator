import { err, ok, type Result } from '#/shared/kernel/Result.js';
import type { DomainError } from '#/shared/kernel/DomainError.js';

import { NotGroupMemberError } from '#/modules/groups/domain/errors.js';
import type { MembershipRepository } from '#/modules/groups/domain/ports/MembershipRepository.js';
import type { UserRepository } from '#/modules/auth/domain/ports/UserRepository.js';
import type { PostRepository } from '#/modules/posts/domain/ports/PostRepository.js';
import { PostNotFoundError } from '#/modules/posts/domain/errors.js';

import { Reply } from '../domain/Reply.js';
import type { ReplyRepository } from '../domain/ports/ReplyRepository.js';

export type ReplyDto = {
  id: string;
  postId: string;
  authorId: string;
  authorDisplayName: string;
  content: string;
  createdAt: Date;
};

function toDto(reply: Reply, authorDisplayName: string): ReplyDto {
  return {
    id: reply.id,
    postId: reply.postId,
    authorId: reply.authorId,
    authorDisplayName,
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
    userRepo: UserRepository;
  },
): Promise<Result<ReplyDto, DomainError>> {
  const post = await deps.postRepo.findById(input.postId);
  if (!post) return err(new PostNotFoundError());

  const membership = await deps.membershipRepo.findByUserAndGroup(input.authorId, post.groupId);
  if (!membership) return err(new NotGroupMemberError());

  const replyResult = Reply.create(input);
  if (!replyResult.ok) return replyResult;

  await deps.replyRepo.save(replyResult.value);

  const [author] = await deps.userRepo.findByIds([input.authorId]);
  const authorDisplayName =
    membership.displayName || author?.username || author?.email || 'Unknown';

  return ok(toDto(replyResult.value, authorDisplayName));
}

export async function listReplies(
  input: { postId: string; userId: string },
  deps: {
    replyRepo: ReplyRepository;
    postRepo: PostRepository;
    membershipRepo: MembershipRepository;
    userRepo: UserRepository;
  },
): Promise<Result<ReplyDto[], DomainError>> {
  const post = await deps.postRepo.findById(input.postId);
  if (!post) return err(new PostNotFoundError());

  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, post.groupId);
  if (!membership) return err(new NotGroupMemberError());

  const replies = await deps.replyRepo.findByPostId(input.postId);
  if (replies.length === 0) return ok([]);

  const [memberships, users] = await Promise.all([
    deps.membershipRepo.findByGroupId(post.groupId),
    deps.userRepo.findByIds(replies.map((r) => r.authorId)),
  ]);

  const membershipMap = new Map(memberships.map((m) => [`${m.userId}:${m.groupId}`, m]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  return ok(
    replies.map((reply) => {
      const authorMembership = membershipMap.get(`${reply.authorId}:${post.groupId}`);
      const author = userMap.get(reply.authorId);
      const authorDisplayName =
        authorMembership?.displayName || author?.username || author?.email || 'Unknown';
      return toDto(reply, authorDisplayName);
    }),
  );
}
