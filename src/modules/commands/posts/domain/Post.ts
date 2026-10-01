import { createId } from '#/shared/kernel/idGenerator.js';
import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { ValidationError } from '#/shared/kernel/DomainError.js';

import type { LinkPreview } from '../linkPreview/domain/LinkPreview.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';

type PostFields = {
  category: Category;
  title: string;
  description?: string | null;
  externalUrl?: string | null;
  rating?: number | null;
};

type NormalizedFields = {
  title: string;
  description: string | null;
  externalUrl: string | null;
  rating: number | null;
};

function normalizeFields(input: PostFields): Result<NormalizedFields, ValidationError> {
  const title = input.title.trim();
  if (title.length === 0 || title.length > 200) {
    return err(new ValidationError('Title must be between 1 and 200 characters'));
  }

  const description = input.description?.trim() ?? null;
  if (description && description.length > 2000) {
    return err(new ValidationError('Description must be at most 2000 characters'));
  }

  const rating = input.rating ?? null;
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 10)) {
    return err(new ValidationError('Rating must be an integer between 1 and 10'));
  }

  return ok({
    title,
    description,
    externalUrl: input.externalUrl?.trim() ?? null,
    rating,
  });
}

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
    readonly rating: number | null,
    readonly createdAt: Date,
  ) {}

  static create(input: {
    groupId: string;
    authorId: string;
    category: Category;
    title: string;
    description?: string | null;
    externalUrl?: string | null;
    rating?: number | null;
  }): Result<Post, ValidationError> {
    const fields = normalizeFields(input);
    if (!fields.ok) return fields;

    return ok(
      new Post(
        createId('pst'),
        input.groupId,
        input.authorId,
        input.category,
        fields.value.title,
        fields.value.description,
        fields.value.externalUrl,
        null,
        null,
        fields.value.rating,
        new Date(),
      ),
    );
  }

  update(input: PostFields): Result<Post, ValidationError> {
    const fields = normalizeFields(input);
    if (!fields.ok) return fields;

    const urlChanged = fields.value.externalUrl !== this.externalUrl;

    return ok(
      new Post(
        this.id,
        this.groupId,
        this.authorId,
        input.category,
        fields.value.title,
        fields.value.description,
        fields.value.externalUrl,
        urlChanged ? null : this.previewImageUrl,
        urlChanged ? null : this.previewEmbedHtml,
        fields.value.rating,
        this.createdAt,
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
      this.rating,
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
    rating: number | null;
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
      input.rating,
      input.createdAt,
    );
  }
}
