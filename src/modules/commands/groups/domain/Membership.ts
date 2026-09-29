import { createId } from '#/shared/kernel/idGenerator.js';
import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { ValidationError } from '#/shared/kernel/DomainError.js';

import type { Role } from '#/shared/infrastructure/db/schema.js';

export class Membership {
  private constructor(
    readonly id: string,
    readonly userId: string,
    readonly groupId: string,
    readonly displayName: string,
    readonly role: Role,
    readonly createdAt: Date,
  ) {}

  static create(input: {
    userId: string;
    groupId: string;
    displayName: string;
    role?: Role;
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
    createdAt: Date;
  }): Membership {
    return new Membership(
      input.id,
      input.userId,
      input.groupId,
      input.displayName,
      input.role,
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
        this.createdAt,
      ),
    );
  }
}
