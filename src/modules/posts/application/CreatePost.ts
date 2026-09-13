import { err, ok, type Result } from '#/shared/kernel/Result.js';
import type { DomainError } from '#/shared/kernel/DomainError.js';

import { fetchLinkPreview } from '#/modules/linkPreview/application/FetchLinkPreview.js';
import type { LinkPreviewService } from '#/modules/linkPreview/application/ports/LinkPreviewService.js';
import { NotGroupMemberError } from '#/modules/groups/domain/errors.js';
import { Membership } from '#/modules/groups/domain/Membership.js';
import type { MembershipRepository } from '#/modules/groups/domain/ports/MembershipRepository.js';
import { User } from '#/modules/auth/domain/User.js';
import type { UserRepository } from '#/modules/auth/domain/ports/UserRepository.js';
import type { Category, ReactionType } from '#/shared/infrastructure/db/schema.js';

import { Post } from '../domain/Post.js';
import type { PostRepository } from '../domain/ports/PostRepository.js';
import type { PostReactionRepository } from '../domain/ports/PostReactionRepository.js';

export type CreatePostInput = {
  groupId: string;
  authorId: string;
  category: Category;
  title: string;
  description?: string | null;
  externalUrl?: string | null;
  rating?: number | null;
};

export type PostDto = {
  id: string;
  groupId: string;
  authorId: string;
  category: Category;
  title: string;
  description: string | null;
  externalUrl: string | null;
  previewImageUrl: string | null;
  previewEmbedHtml: string | null;
  rating: number | null;
  authorDisplayName: string;
  reactions: Array<{ type: ReactionType; count: number }>;
  myReactions: ReactionType[];
  createdAt: Date;
};

function toDto(
  post: Post,
  authorDisplayName: string,
  reactions: Array<{ type: ReactionType; count: number }>,
  myReactions: ReactionType[],
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
    createdAt: post.createdAt,
  };
}

function resolveDisplayName(
  userId: string,
  groupId: string,
  memberships: Map<string, Membership>,
  users: Map<string, User>,
): string {
  const membership = memberships.get(`${userId}:${groupId}`);
  if (membership?.displayName) return membership.displayName;

  const user = users.get(userId);
  if (user?.username) return user.username;
  if (user?.email) return user.email;

  return 'Unknown';
}

export async function createPost(
  input: CreatePostInput,
  deps: {
    postRepo: PostRepository;
    membershipRepo: MembershipRepository;
    userRepo: UserRepository;
    linkPreviewService: LinkPreviewService;
  },
): Promise<Result<PostDto, DomainError>> {
  const membership = await deps.membershipRepo.findByUserAndGroup(input.authorId, input.groupId);
  if (!membership) return err(new NotGroupMemberError());

  const postResult = Post.create(input);
  if (!postResult.ok) return postResult;

  let post = postResult.value;

  if (post.externalUrl) {
    const preview = await fetchLinkPreview(post.externalUrl, {
      linkPreviewService: deps.linkPreviewService,
    });
    post = post.withPreview(preview);
  }

  await deps.postRepo.save(post);

  const [author] = await deps.userRepo.findByIds([post.authorId]);
  const authorDisplayName =
    membership.displayName || author?.username || author?.email || 'Unknown';

  return ok(toDto(post, authorDisplayName, [], []));
}

export async function listTimelinePosts(
  input: { groupId: string; userId: string; category?: Category },
  deps: {
    postRepo: PostRepository;
    membershipRepo: MembershipRepository;
    userRepo: UserRepository;
    postReactionRepo: PostReactionRepository;
  },
): Promise<Result<PostDto[], DomainError>> {
  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, input.groupId);
  if (!membership) return err(new NotGroupMemberError());

  const posts = await deps.postRepo.findByGroupId(input.groupId, { category: input.category });
  if (posts.length === 0) return ok([]);

  const postIds = posts.map((p) => p.id);
  const [groupMemberships, users, counts, myReactions] = await Promise.all([
    deps.membershipRepo.findByGroupId(input.groupId),
    deps.userRepo.findByIds(posts.map((p) => p.authorId)),
    deps.postReactionRepo.findCountsByPostIds(postIds),
    deps.postReactionRepo.findByPostIdsAndUserId(postIds, input.userId),
  ]);

  const membershipMap = new Map(groupMemberships.map((m) => [`${m.userId}:${m.groupId}`, m]));
  const userMap = new Map(users.map((u) => [u.id, u]));
  const countsMap = new Map<string, Map<ReactionType, number>>();

  for (const { postId, type, count } of counts) {
    if (!countsMap.has(postId)) countsMap.set(postId, new Map());
    countsMap.get(postId)!.set(type, count);
  }

  const myReactionsMap = new Map<string, ReactionType[]>();
  for (const reaction of myReactions) {
    if (!myReactionsMap.has(reaction.postId)) myReactionsMap.set(reaction.postId, []);
    myReactionsMap.get(reaction.postId)!.push(reaction.type);
  }

  return ok(
    posts.map((post) => {
      const allTypes: ReactionType[] = ['interested', 'liked', 'not_liked', 'viewed'];
      const postCounts = countsMap.get(post.id) ?? new Map();
      const reactions = allTypes.map((type) => ({
        type,
        count: postCounts.get(type) ?? 0,
      }));

      return toDto(
        post,
        resolveDisplayName(post.authorId, post.groupId, membershipMap, userMap),
        reactions,
        myReactionsMap.get(post.id) ?? [],
      );
    }),
  );
}
