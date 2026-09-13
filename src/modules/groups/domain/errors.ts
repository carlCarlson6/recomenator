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

export class ExpiredInviteError extends DomainError {
  readonly code = 'EXPIRED_INVITE';
  constructor() {
    super('Invite has expired');
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

export class UnauthorizedToManageGroupError extends DomainError {
  readonly code = 'UNAUTHORIZED_TO_MANAGE_GROUP';
  constructor() {
    super('Only the group owner can manage invites');
  }
}
