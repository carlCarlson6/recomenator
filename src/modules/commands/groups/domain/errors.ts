import { DomainError } from '#/shared/kernel/DomainError.js';

export class GroupNotFoundError extends DomainError {
  readonly code = 'GROUP_NOT_FOUND';
  constructor() {
    super('Group not found');
  }
}

export class InviteNotFoundError extends DomainError {
  readonly code = 'INVITE_NOT_FOUND';
  constructor() {
    super('Invite not found');
  }
}

export class InviteExhaustedError extends DomainError {
  readonly code = 'INVITE_EXHAUSTED';
  constructor() {
    super('Invite can no longer be used');
  }
}

export class AlreadyMemberError extends DomainError {
  readonly code = 'ALREADY_MEMBER';
  constructor() {
    super('You are already a member of this group');
  }
}

export class NotGroupMemberError extends DomainError {
  readonly code = 'NOT_GROUP_MEMBER';
  constructor() {
    super('You are not a member of this group');
  }
}
