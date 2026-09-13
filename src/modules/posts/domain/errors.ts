import { DomainError } from '#/shared/kernel/DomainError.js';

export class PostNotFoundError extends DomainError {
  readonly code = 'POST_NOT_FOUND';
  constructor() {
    super('Post not found');
  }
}
