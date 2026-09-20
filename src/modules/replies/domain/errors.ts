import { DomainError } from '#/shared/kernel/DomainError.js';

export class ReplyNotFoundError extends DomainError {
  readonly code = 'REPLY_NOT_FOUND';
  constructor() {
    super('Reply not found');
  }
}

export class ReplyToDeletedReplyError extends DomainError {
  readonly code = 'REPLY_TO_DELETED_REPLY';
  constructor() {
    super('Cannot reply to a deleted reply');
  }
}

export class ReplyPostMismatchError extends DomainError {
  readonly code = 'REPLY_POST_MISMATCH';
  constructor() {
    super('Parent reply belongs to a different post');
  }
}
