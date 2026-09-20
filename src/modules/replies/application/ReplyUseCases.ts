import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { UnauthorizedError, type DomainError } from '#/shared/kernel/DomainError.js';

import { NotGroupMemberError } from '#/modules/groups/domain/errors.js';
import type { MembershipRepository } from '#/modules/groups/domain/ports/MembershipRepository.js';
import type { UserRepository } from '#/modules/auth/domain/ports/UserRepository.js';
import type { PostRepository } from '#/modules/posts/domain/ports/PostRepository.js';
import { PostNotFoundError } from '#/modules/posts/domain/errors.js';

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

export type ReplyNodeDto = ReplyDto & {
  children: ReplyNodeDto[];
  depth: number;
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
    userRepo: UserRepository;
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
): Promise<Result<ReplyNodeDto[], DomainError>> {
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

  const dtoMap = new Map<string, ReplyNodeDto>();

  for (const reply of replies) {
    const authorMembership = membershipMap.get(`${reply.authorId}:${post.groupId}`);
    const author = userMap.get(reply.authorId);
    const authorDisplayName =
      authorMembership?.displayName || author?.username || author?.email || 'Unknown';
    dtoMap.set(reply.id, {
      ...toDto(reply, authorDisplayName),
      children: [],
      depth: 0,
    });
  }

  const roots: ReplyNodeDto[] = [];
  const maxDepth = 100;

  for (const dto of dtoMap.values()) {
    if (dto.parentId) {
      const parent = dtoMap.get(dto.parentId);
      if (parent) {
        parent.children.push(dto);
      } else {
        roots.push(dto);
      }
    } else {
      roots.push(dto);
    }
  }

  function assignDepth(node: ReplyNodeDto, depth: number): void {
    if (depth > maxDepth) return;
    node.depth = depth;
    for (const child of node.children) {
      assignDepth(child, depth + 1);
    }
  }

  for (const root of roots) {
    assignDepth(root, 0);
  }

  return ok(roots);
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
