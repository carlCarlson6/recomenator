import { createId } from '#/shared/kernel/idGenerator.js';
import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { ValidationError } from '#/shared/kernel/DomainError.js';

export class Reply {
  private constructor(
    readonly id: string,
    readonly postId: string,
    readonly authorId: string,
    readonly content: string,
    readonly parentId: string | null,
    readonly deletedAt: Date | null,
    readonly createdAt: Date,
  ) {}

  static create(input: {
    postId: string;
    authorId: string;
    content: string;
    parentId?: string;
  }): Result<Reply, ValidationError> {
    const content = input.content.trim();
    if (content.length === 0 || content.length > 1000) {
      return err(new ValidationError('Reply must be between 1 and 1000 characters'));
    }
    return ok(
      new Reply(
        createId('rpl'),
        input.postId,
        input.authorId,
        content,
        input.parentId ?? null,
        null,
        new Date(),
      ),
    );
  }

  static reconstitute(input: {
    id: string;
    postId: string;
    authorId: string;
    content: string;
    parentId: string | null;
    deletedAt: Date | null;
    createdAt: Date;
  }): Reply {
    return new Reply(
      input.id,
      input.postId,
      input.authorId,
      input.content,
      input.parentId,
      input.deletedAt,
      input.createdAt,
    );
  }

  delete(): Reply {
    return new Reply(
      this.id,
      this.postId,
      this.authorId,
      this.content,
      this.parentId,
      new Date(),
      this.createdAt,
    );
  }
}
