import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { NotFoundError, UnauthorizedError, type DomainError } from '#/shared/kernel/DomainError.js';

import type { PostRepository } from '../domain/ports/PostRepository.js';

export type DeletePostInput = {
  postId: string;
  userId: string;
};

export async function deletePost(
  input: DeletePostInput,
  deps: {
    postRepo: PostRepository;
  },
): Promise<Result<void, DomainError>> {
  const post = await deps.postRepo.findById(input.postId);
  if (!post) return err(new NotFoundError('Post'));

  if (post.authorId !== input.userId) {
    return err(new UnauthorizedError('Post does not belong to user'));
  }

  await deps.postRepo.delete(input.postId);
  return ok(undefined);
}
