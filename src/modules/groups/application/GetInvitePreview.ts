import { err, ok, type Result } from '#/shared/kernel/Result.js';
import type { DomainError } from '#/shared/kernel/DomainError.js';

import {
  ExpiredInviteError,
  GroupNotFoundError,
  InviteNotFoundError,
} from '../domain/errors.js';
import type { GroupRepository } from '../domain/ports/GroupRepository.js';
import type { InviteRepository } from '../domain/ports/InviteRepository.js';

export type GetInvitePreviewInput = {
  code: string;
};

export type InvitePreviewDto = {
  groupId: string;
  groupName: string;
};

export async function getInvitePreview(
  input: GetInvitePreviewInput,
  deps: {
    inviteRepo: InviteRepository;
    groupRepo: GroupRepository;
  },
): Promise<Result<InvitePreviewDto, DomainError>> {
  const invite = await deps.inviteRepo.findByCode(input.code);
  if (!invite) return err(new InviteNotFoundError());

  const valid = invite.validate();
  if (!valid.ok) return err(new ExpiredInviteError());

  const group = await deps.groupRepo.findById(invite.groupId);
  if (!group) return err(new GroupNotFoundError());

  return ok({ groupId: group.id, groupName: group.name });
}
