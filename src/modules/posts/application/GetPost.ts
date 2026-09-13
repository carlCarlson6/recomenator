import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { DomainError } from '#/shared/kernel/DomainError.js';

import { NotGroupMemberError } from '#/modules/groups/domain/errors.js';
import type { MembershipRepository } from '#/modules/groups/domain/ports/MembershipRepository.js';

import { Post } from '../domain/Post.js';
import type { PostRepository } from '../domain/ports/PostRepository.js';

class PostNotFoundError extends DomainError {
  readonly code = 'POST_NOT_FOUND';
  constructor() {
    super('Post not found');
  }
}

function toDto(post: Post) {
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

export type PostDto = ReturnType<typeof toDto>;

export async function getPost(
  input: { postId: string; userId: string },
  deps: { postRepo: PostRepository; membershipRepo: MembershipRepository },
): Promise<Result<PostDto, DomainError>> {
  const post = await deps.postRepo.findById(input.postId);
  if (!post) return err(new PostNotFoundError());

  const membership = await deps.membershipRepo.findByUserAndGroup(input.userId, post.groupId);
  if (!membership) return err(new NotGroupMemberError());

  return ok(toDto(post));
}
