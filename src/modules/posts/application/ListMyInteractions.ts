import { err, ok, type Result } from '#/shared/kernel/Result.js';
import type { DomainError } from '#/shared/kernel/DomainError.js';

import { NotGroupMemberError } from '#/modules/groups/domain/errors.js';
import { Membership } from '#/modules/groups/domain/Membership.js';
import type { MembershipRepository } from '#/modules/groups/domain/ports/MembershipRepository.js';
import { User } from '#/modules/auth/domain/User.js';
import type { UserRepository } from '#/modules/auth/domain/ports/UserRepository.js';
import type { Category, ReactionType } from '#/shared/infrastructure/db/schema.js';
import type { ReplyRepository } from '../replies/domain/ports/ReplyRepository.js';

import type { PostRepository } from '../domain/ports/PostRepository.js';
import type { PostReactionRepository } from '../domain/ports/PostReactionRepository.js';
import type { PostDto } from './CreatePost.js';

export type ListMyInteractionsInput = {
  groupId: string;
  userId: string;
  categories?: Category[];
  types?: ReactionType[];
};

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

export async function listMyInteractions(
  input: ListMyInteractionsInput,
  deps: {
    postRepo: PostRepository;
    membershipRepo: MembershipRepository;
    userRepo: UserRepository;
    postReactionRepo: PostReactionRepository;
    replyRepo: ReplyRepository;
  },
): Promise<Result<PostDto[], DomainError>> {
  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, input.groupId);
  if (!membership) return err(new NotGroupMemberError());

  const reactions = await deps.postReactionRepo.findByUserIdAndGroupId({
    userId: input.userId,
    groupId: input.groupId,
    categories: input.categories,
    types: input.types,
  });

  if (reactions.length === 0) return ok([]);

  const postIds = [...new Set(reactions.map((r) => r.postId))];

  const [posts, counts, replyCounts, groupMemberships] = await Promise.all([
    deps.postRepo.findByIds(postIds),
    deps.postReactionRepo.findCountsByPostIds(postIds),
    deps.replyRepo.countByPostIds(postIds),
    deps.membershipRepo.findByGroupId(input.groupId),
  ]);

  const authorIds = [...new Set(posts.map((p) => p.authorId))];
  const users = authorIds.length > 0 ? await deps.userRepo.findByIds(authorIds) : [];

  const postMap = new Map(posts.map((p) => [p.id, p]));
  const membershipMap = new Map(groupMemberships.map((m) => [`${m.userId}:${m.groupId}`, m]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  const countsMap = new Map<string, Map<ReactionType, number>>();
  for (const { postId, type, count } of counts) {
    if (!countsMap.has(postId)) countsMap.set(postId, new Map());
    countsMap.get(postId)!.set(type, count);
  }

  const myReactionsMap = new Map<string, ReactionType[]>();
  const lastReactedAtMap = new Map<string, Date>();
  for (const reaction of reactions) {
    if (!myReactionsMap.has(reaction.postId)) myReactionsMap.set(reaction.postId, []);
    myReactionsMap.get(reaction.postId)!.push(reaction.type);

    const existing = lastReactedAtMap.get(reaction.postId);
    if (!existing || reaction.createdAt.getTime() > existing.getTime()) {
      lastReactedAtMap.set(reaction.postId, reaction.createdAt);
    }
  }

  const replyCountMap = new Map(replyCounts.map((c) => [c.postId, c.count]));
  const allTypes: ReactionType[] = ['interested', 'liked', 'not_liked', 'viewed'];

  const dtos = [...myReactionsMap.keys()]
    .map((postId) => {
      const post = postMap.get(postId);
      if (!post) return null;

      const postCounts = countsMap.get(post.id) ?? new Map();
      const reactionsList = allTypes.map((type) => ({
        type,
        count: postCounts.get(type) ?? 0,
      }));

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
        authorDisplayName: resolveDisplayName(post.authorId, post.groupId, membershipMap, userMap),
        reactions: reactionsList,
        myReactions: myReactionsMap.get(post.id) ?? [],
        replyCount: replyCountMap.get(post.id) ?? 0,
        createdAt: post.createdAt,
      };
    })
    .filter((dto): dto is NonNullable<typeof dto> => dto !== null)
    .sort((a, b) => {
      const aTime = lastReactedAtMap.get(a.id)!.getTime();
      const bTime = lastReactedAtMap.get(b.id)!.getTime();
      return bTime - aTime;
    });

  return ok(dtos);
}
