import { err, ok, type Result } from '#/shared/kernel/Result.js';
import type { DomainError } from '#/shared/kernel/DomainError.js';

import { fetchLinkPreview } from '#/modules/linkPreview/application/FetchLinkPreview.js';
import type { LinkPreviewService } from '#/modules/linkPreview/application/ports/LinkPreviewService.js';
import { NotGroupMemberError } from '#/modules/groups/domain/errors.js';
import type { MembershipRepository } from '#/modules/groups/domain/ports/MembershipRepository.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';

import { Post } from '../domain/Post.js';
import type { PostRepository } from '../domain/ports/PostRepository.js';

export type CreatePostInput = {
  groupId: string;
  authorId: string;
  category: Category;
  title: string;
  description?: string | null;
  externalUrl?: string | null;
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
  createdAt: Date;
};

function toDto(post: Post): PostDto {
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
    createdAt: post.createdAt,
  };
}

export async function createPost(
  input: CreatePostInput,
  deps: {
    postRepo: PostRepository;
    membershipRepo: MembershipRepository;
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
  return ok(toDto(post));
}

export async function listTimelinePosts(
  input: { groupId: string; userId: string; category?: Category },
  deps: { postRepo: PostRepository; membershipRepo: MembershipRepository },
): Promise<Result<PostDto[], DomainError>> {
  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, input.groupId);
  if (!membership) return err(new NotGroupMemberError());

  const posts = await deps.postRepo.findByGroupId(input.groupId, { category: input.category });
  return ok(posts.map(toDto));
}
