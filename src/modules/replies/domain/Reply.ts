import { createId } from '#/shared/kernel/idGenerator.js';
import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { ValidationError } from '#/shared/kernel/DomainError.js';

export class Reply {
  private constructor(
    readonly id: string,
    readonly postId: string,
    readonly authorId: string,
    readonly content: string,
    readonly createdAt: Date,
  ) {}

  static create(input: {
    postId: string;
    authorId: string;
    content: string;
  }): Result<Reply, ValidationError> {
    const content = input.content.trim();
    if (content.length === 0 || content.length > 1000) {
      return err(new ValidationError('Reply must be between 1 and 1000 characters'));
    }
    return ok(new Reply(createId('rpl'), input.postId, input.authorId, content, new Date()));
  }

  static reconstitute(input: {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    createdAt: Date;
  }): Reply {
    return new Reply(input.id, input.postId, input.authorId, input.content, input.createdAt);
  }
}
