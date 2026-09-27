import { customAlphabet } from 'nanoid';

import { createId } from '#/shared/kernel/idGenerator.js';
import { err, ok, type Result } from '#/shared/kernel/Result.js';

import { ExpiredInviteError } from './errors.js';

const codeAlphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const generateCode = customAlphabet(codeAlphabet, 32);

const INVITE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export class Invite {
  private constructor(
    readonly id: string,
    readonly code: string,
    readonly groupId: string,
    readonly expiresAt: Date,
    readonly usageCount: number,
    readonly maxUses: number | null,
    readonly createdById: string,
    readonly createdAt: Date,
  ) {}

  static create(input: {
    groupId: string;
    createdById: string;
    maxUses?: number | null;
  }): Invite {
    return new Invite(
      createId('inv'),
      generateCode(),
      input.groupId,
      new Date(Date.now() + INVITE_TTL_MS),
      0,
      input.maxUses ?? null,
      input.createdById,
      new Date(),
    );
  }

  static reconstitute(input: {
    id: string;
    code: string;
    groupId: string;
    expiresAt: Date;
    usageCount: number;
    maxUses: number | null;
    createdById: string;
    createdAt: Date;
  }): Invite {
    return new Invite(
      input.id,
      input.code,
      input.groupId,
      input.expiresAt,
      input.usageCount,
      input.maxUses,
      input.createdById,
      input.createdAt,
    );
  }

  validate(): Result<void, ExpiredInviteError> {
    if (this.expiresAt <= new Date()) {
      return err(new ExpiredInviteError());
    }
    if (this.maxUses !== null && this.usageCount >= this.maxUses) {
      return err(new ExpiredInviteError());
    }
    return ok(undefined);
  }

  markUsed(): Invite {
    return new Invite(
      this.id,
      this.code,
      this.groupId,
      this.expiresAt,
      this.usageCount + 1,
      this.maxUses,
      this.createdById,
      this.createdAt,
    );
  }
}
