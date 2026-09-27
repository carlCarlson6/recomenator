import { err, ok, type Result } from '#/shared/kernel/Result.js';
import type { DomainError } from '#/shared/kernel/DomainError.js';

import { fetchLinkPreview } from '../linkPreview/application/FetchLinkPreview.js';
import type { LinkPreviewService } from '../linkPreview/application/ports/LinkPreviewService.js';
import { NotGroupMemberError } from '#/modules/commands/groups/domain/errors.js';
import type { MembershipRepository } from '#/modules/commands/groups/domain/ports/MembershipRepository.js';
import type { UserRepository } from '#/modules/commands/auth/domain/ports/UserRepository.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';

import { Post } from '../domain/Post.js';
import type { PostRepository } from '../domain/ports/PostRepository.js';
import type { DraftRepository } from '../domain/ports/DraftRepository.js';

export type CreatePostInput = {
  groupId: string;
  authorId: string;
  category: Category;
  title: string;
  description?: string | null;
  externalUrl?: string | null;
  rating?: number | null;
  draftId?: string;
};

export async function createPost(
  input: CreatePostInput,
  deps: {
    postRepo: PostRepository;
    membershipRepo: MembershipRepository;
    userRepo: UserRepository;
    linkPreviewService: LinkPreviewService;
    draftRepo: DraftRepository;
  },
): Promise<Result<{ id: string }, DomainError>> {
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

  if (input.draftId) {
    await deps.draftRepo.deleteByIdAndAuthorId(input.draftId, input.authorId);
  }

  return ok({ id: post.id });
}
