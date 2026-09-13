import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { DomainError } from '#/shared/kernel/DomainError.js';

import { NotGroupMemberError } from '#/modules/groups/domain/errors.js';
import type { MembershipRepository } from '#/modules/groups/domain/ports/MembershipRepository.js';
import type { UserRepository } from '#/modules/auth/domain/ports/UserRepository.js';
import type { ReactionType } from '#/shared/infrastructure/db/schema.js';

import { Post } from '../domain/Post.js';
import type { PostRepository } from '../domain/ports/PostRepository.js';
import type { PostReactionRepository } from '../domain/ports/PostReactionRepository.js';
import type { ReplyRepository } from '#/modules/replies/domain/ports/ReplyRepository.js';
import type { PostDto } from './CreatePost.js';

class PostNotFoundError extends DomainError {
  readonly code = 'POST_NOT_FOUND';
  constructor() {
    super('Post not found');
  }
}

function buildDto(
  post: Post,
  authorDisplayName: string,
  reactions: Array<{ type: ReactionType; count: number }>,
  myReactions: ReactionType[],
  replyCount: number,
): PostDto {
  return {
    id: post.id,
    groupId: post.groupId,
    authorId: post.authorId,
    category: post.category,
    title: post.title,
    description: post.description,
    externalUrl: post.externalUrl,
    previewImageUrl: post.previewImageUrl,
    previewEmbedHtml: post.previewEmbedHtml,
    rating: post.rating,
    authorDisplayName,
    reactions,
    myReactions,
    replyCount,
    createdAt: post.createdAt,
  };
}

export async function getPost(
  input: { postId: string; userId: string },
  deps: {
    postRepo: PostRepository;
    membershipRepo: MembershipRepository;
    userRepo: UserRepository;
    postReactionRepo: PostReactionRepository;
    replyRepo: ReplyRepository;
  },
): Promise<Result<PostDto, DomainError>> {
  const post = await deps.postRepo.findById(input.postId);
  if (!post) return err(new PostNotFoundError());

  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, post.groupId);
  if (!membership) return err(new NotGroupMemberError());

  const [authorMembership, author, counts, myReactions, replyCounts] = await Promise.all([
    deps.membershipRepo.findByUserAndGroup(post.authorId, post.groupId),
    deps.userRepo.findById(post.authorId),
    deps.postReactionRepo.findCountsByPostIds([post.id]),
    deps.postReactionRepo.findByPostIdsAndUserId([post.id], input.userId),
    deps.replyRepo.countByPostIds([post.id]),
  ]);

  const authorDisplayName =
    authorMembership?.displayName || author?.username || author?.email || 'Unknown';

  const countsMap = new Map<ReactionType, number>();
  for (const { type, count } of counts) {
    countsMap.set(type, count);
  }

  const allTypes: ReactionType[] = ['interested', 'liked', 'not_liked', 'viewed'];
  const reactions = allTypes.map((type) => ({
    type,
    count: countsMap.get(type) ?? 0,
  }));

  const replyCount = replyCounts.find((c) => c.postId === post.id)?.count ?? 0;

  return ok(buildDto(post, authorDisplayName, reactions, myReactions.map((r) => r.type), replyCount));
}
