import { createId } from '#/shared/kernel/idGenerator.js';
import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { ValidationError } from '#/shared/kernel/DomainError.js';

import type { Category } from '#/shared/infrastructure/db/schema.js';

export class Draft {
  private constructor(
    readonly id: string,
    readonly groupId: string,
    readonly authorId: string,
    readonly category: Category,
    readonly title: string | null,
    readonly description: string | null,
    readonly externalUrl: string | null,
    readonly rating: number | null,
    readonly createdAt: Date,
    readonly updatedAt: Date,
  ) {}

  static create(input: {
    groupId: string;
    authorId: string;
    category: Category;
    title?: string | null;
    description?: string | null;
    externalUrl?: string | null;
    rating?: number | null;
  }): Result<Draft, ValidationError> {
    const title = normalizeOptionalString(input.title);
    if (title && title.length > 200) {
      return err(new ValidationError('Title must be at most 200 characters'));
    }

    const description = normalizeOptionalString(input.description);
    if (description && description.length > 2000) {
      return err(new ValidationError('Description must be at most 2000 characters'));
    }

    const externalUrl = normalizeOptionalString(input.externalUrl);

    const rating = input.rating ?? null;
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 10)) {
      return err(new ValidationError('Rating must be an integer between 1 and 10'));
    }

    const now = new Date();
    return ok(
      new Draft(
        createId('drf'),
        input.groupId,
        input.authorId,
        input.category,
        title,
        description,
        externalUrl,
        rating,
        now,
        now,
      ),
    );
  }

  update(input: {
    category: Category;
    title?: string | null;
    description?: string | null;
    externalUrl?: string | null;
    rating?: number | null;
  }): Result<Draft, ValidationError> {
    const title = normalizeOptionalString(input.title);
    if (title && title.length > 200) {
      return err(new ValidationError('Title must be at most 200 characters'));
    }

    const description = normalizeOptionalString(input.description);
    if (description && description.length > 2000) {
      return err(new ValidationError('Description must be at most 2000 characters'));
    }

    const externalUrl = normalizeOptionalString(input.externalUrl);

    const rating = input.rating ?? null;
    if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 10)) {
      return err(new ValidationError('Rating must be an integer between 1 and 10'));
    }

    return ok(
      new Draft(
        this.id,
        this.groupId,
        this.authorId,
        input.category,
        title,
        description,
        externalUrl,
        rating,
        this.createdAt,
        new Date(),
      ),
    );
  }

  static reconstitute(input: {
    id: string;
    groupId: string;
    authorId: string;
    category: Category;
    title: string | null;
    description: string | null;
    externalUrl: string | null;
    rating: number | null;
    createdAt: Date;
    updatedAt: Date;
  }): Draft {
    return new Draft(
      input.id,
      input.groupId,
      input.authorId,
      input.category,
      input.title,
      input.description,
      input.externalUrl,
      input.rating,
      input.createdAt,
      input.updatedAt,
    );
  }
}

function normalizeOptionalString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
