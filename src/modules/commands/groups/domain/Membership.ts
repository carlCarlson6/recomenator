import { createId } from '#/shared/kernel/idGenerator.js';
import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { ValidationError } from '#/shared/kernel/DomainError.js';

import type { Role } from '#/shared/infrastructure/db/schema.js';

const MAX_AVATAR_URL_LENGTH = 2048;

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export class Membership {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly groupId: string,
    readonly displayName: string,
    readonly role: Role,
    readonly avatarUrl: string | null,
    readonly createdAt: Date,
  ) {}

  static create(input: {
    userId: string;
    groupId: string;
    displayName: string;
    role?: Role;
    avatarUrl?: string | null;
  }): Result<Membership, ValidationError> {
    const trimmed = input.displayName.trim();
    if (trimmed.length === 0 || trimmed.length > 50) {
      return err(new ValidationError('Display name must be between 1 and 50 characters'));
    }
    return ok(
      new Membership(
        createId('mem'),
        input.userId,
        input.groupId,
        trimmed,
        input.role ?? 'member',
        input.avatarUrl ?? null,
        new Date(),
      ),
    );
  }

  static reconstitute(input: {
    id: string;
    userId: string;
    groupId: string;
    displayName: string;
    role: Role;
    avatarUrl?: string | null;
    createdAt: Date;
  }): Membership {
    return new Membership(
      input.id,
      input.userId,
      input.groupId,
      input.displayName,
      input.role,
      input.avatarUrl ?? null,
      input.createdAt,
    );
  }

  updateDisplayName(displayName: string): Result<Membership, ValidationError> {
    const trimmed = displayName.trim();
    if (trimmed.length === 0 || trimmed.length > 50) {
      return err(new ValidationError('Display name must be between 1 and 50 characters'));
    }
    return ok(
      new Membership(
        this.id,
        this.userId,
        this.groupId,
        trimmed,
        this.role,
        this.avatarUrl,
        this.createdAt,
      ),
    );
  }

  updateAvatarUrl(avatarUrl: string | null): Result<Membership, ValidationError> {
    if (avatarUrl === null) {
      return ok(
        new Membership(
          this.id,
          this.userId,
          this.groupId,
          this.displayName,
          this.role,
          null,
          this.createdAt,
        ),
      );
    }

    const trimmed = avatarUrl.trim();
    if (trimmed.length === 0 || trimmed.length > MAX_AVATAR_URL_LENGTH || !isHttpUrl(trimmed)) {
      return err(new ValidationError('Avatar URL must be a valid http(s) URL'));
    }

    return ok(
      new Membership(
        this.id,
        this.userId,
        this.groupId,
        this.displayName,
        this.role,
        trimmed,
        this.createdAt,
      ),
    );
  }
}
