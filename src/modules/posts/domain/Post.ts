import { createId } from '#/shared/kernel/idGenerator.js';
import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { ValidationError } from '#/shared/kernel/DomainError.js';

import type { LinkPreview } from '#/modules/linkPreview/domain/LinkPreview.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';

export class Post {
  private constructor(
    readonly id: string,
    readonly groupId: string,
    readonly authorId: string,
    readonly category: Category,
    readonly title: string,
    readonly description: string | null,
    readonly externalUrl: string | null,
    readonly previewImageUrl: string | null,
    readonly previewEmbedHtml: string | null,
    readonly createdAt: Date,
  ) {}

  static create(input: {
    groupId: string;
    authorId: string;
    category: Category;
    title: string;
    description?: string | null;
    externalUrl?: string | null;
  }): Result<Post, ValidationError> {
    const title = input.title.trim();
    if (title.length === 0 || title.length > 200) {
      return err(new ValidationError('Title must be between 1 and 200 characters'));
    }

    const description = input.description?.trim() ?? null;
    if (description && description.length > 2000) {
      return err(new ValidationError('Description must be at most 2000 characters'));
    }

    return ok(
      new Post(
        createId('pst'),
        input.groupId,
        input.authorId,
        input.category,
        title,
        description,
        input.externalUrl?.trim() ?? null,
        null,
        null,
        new Date(),
      ),
    );
  }

  withPreview(preview: LinkPreview): Post {
    return new Post(
      this.id,
      this.groupId,
      this.authorId,
      this.category,
      this.title,
      this.description,
      this.externalUrl,
      preview.imageUrl ?? null,
      preview.embedHtml ?? null,
      this.createdAt,
    );
  }

  static reconstitute(input: {
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
  }): Post {
    return new Post(
      input.id,
      input.groupId,
      input.authorId,
      input.category,
      input.title,
      input.description,
      input.externalUrl,
      input.previewImageUrl,
      input.previewEmbedHtml,
      input.createdAt,
    );
  }
}
