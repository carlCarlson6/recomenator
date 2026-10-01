import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { NotFoundError, UnauthorizedError, type DomainError } from '#/shared/kernel/DomainError.js';

import { fetchLinkPreview } from '../linkPreview/application/FetchLinkPreview.js';
import type { LinkPreviewService } from '../linkPreview/application/ports/LinkPreviewService.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';

import type { PostRepository } from '../domain/ports/PostRepository.js';

export type EditPostInput = {
  postId: string;
  userId: string;
  category: Category;
  title: string;
  description?: string | null;
  externalUrl?: string | null;
  rating?: number | null;
};

export async function editPost(
  input: EditPostInput,
  deps: {
    postRepo: PostRepository;
    linkPreviewService: LinkPreviewService;
  },
): Promise<Result<{ id: string }, DomainError>> {
  const post = await deps.postRepo.findById(input.postId);
  if (!post) return err(new NotFoundError('Post'));

  if (post.authorId !== input.userId) {
    return err(new UnauthorizedError('Post does not belong to user'));
  }

  const updated = post.update({
    category: input.category,
    title: input.title,
    description: input.description,
    externalUrl: input.externalUrl,
    rating: input.rating,
  });
  if (!updated.ok) return updated;

  let result = updated.value;

  if (result.externalUrl && result.externalUrl !== post.externalUrl) {
    const preview = await fetchLinkPreview(result.externalUrl, {
      linkPreviewService: deps.linkPreviewService,
    });
    result = result.withPreview(preview);
  }

  await deps.postRepo.save(result);

  return ok({ id: result.id });
}
