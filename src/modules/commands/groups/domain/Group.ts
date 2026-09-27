import { createId } from '#/shared/kernel/idGenerator.js';
import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { ValidationError } from '#/shared/kernel/DomainError.js';

export class Group {
  private constructor(
    readonly id: string,
    readonly name: string,
    readonly createdById: string,
    readonly createdAt: Date,
  ) {}

  static create(input: { name: string; createdById: string }): Result<Group, ValidationError> {
    const trimmed = input.name.trim();
    if (trimmed.length === 0 || trimmed.length > 100) {
      return err(new ValidationError('Group name must be between 1 and 100 characters'));
    }
    return ok(new Group(createId('grp'), trimmed, input.createdById, new Date()));
  }

  static reconstitute(input: { id: string; name: string; createdById: string; createdAt: Date }): Group {
    return new Group(input.id, input.name, input.createdById, input.createdAt);
  }

  isManagedBy(userId: string): boolean {
    return this.createdById === userId;
  }
}
