import { err, ok, type Result } from '#/shared/kernel/Result.js';
import { NotFoundError, UnauthorizedError } from '#/shared/kernel/DomainError.js';
import type { DomainError } from '#/shared/kernel/DomainError.js';
import { NotGroupMemberError } from '#/modules/groups/domain/errors.js';
import type { MembershipRepository } from '#/modules/groups/domain/ports/MembershipRepository.js';
import type { Category } from '#/shared/infrastructure/db/schema.js';

import { Draft } from '../domain/Draft.js';
import type { DraftRepository } from '../domain/ports/DraftRepository.js';

export type DraftDto = {
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
};

function toDto(draft: Draft): DraftDto {
  return {
    id: draft.id,
    groupId: draft.groupId,
    authorId: draft.authorId,
    category: draft.category,
    title: draft.title,
    description: draft.description,
    externalUrl: draft.externalUrl,
    rating: draft.rating,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
  };
}

export type SaveDraftInput = {
  draftId?: string;
  groupId: string;
  authorId: string;
  category: Category;
  title?: string | null;
  description?: string | null;
  externalUrl?: string | null;
  rating?: number | null;
};

export async function saveDraft(
  input: SaveDraftInput,
  deps: {
    draftRepo: DraftRepository;
    membershipRepo: MembershipRepository;
  },
): Promise<Result<DraftDto, DomainError>> {
  const membership = await deps.membershipRepo.findByUserAndGroup(input.authorId, input.groupId);
  if (!membership) return err(new NotGroupMemberError());

  if (input.draftId) {
    const existing = await deps.draftRepo.findById(input.draftId);
    if (!existing) return err(new NotFoundError('Draft'));
    if (existing.authorId !== input.authorId || existing.groupId !== input.groupId) {
      return err(new UnauthorizedError('Draft does not belong to user'));
    }

    const updated = existing.update({
      category: input.category,
      title: input.title,
      description: input.description,
      externalUrl: input.externalUrl,
      rating: input.rating,
    });
    if (!updated.ok) return updated;

    await deps.draftRepo.save(updated.value);
    return ok(toDto(updated.value));
  }

  const created = Draft.create({
    groupId: input.groupId,
    authorId: input.authorId,
    category: input.category,
    title: input.title,
    description: input.description,
    externalUrl: input.externalUrl,
    rating: input.rating,
  });
  if (!created.ok) return created;

  await deps.draftRepo.save(created.value);
  return ok(toDto(created.value));
}

export type ListDraftsInput = {
  groupId: string;
  authorId: string;
};

export async function listDrafts(
  input: ListDraftsInput,
  deps: {
    draftRepo: DraftRepository;
    membershipRepo: MembershipRepository;
  },
): Promise<Result<DraftDto[], DomainError>> {
  const membership = await deps.membershipRepo.findByUserAndGroup(input.authorId, input.groupId);
  if (!membership) return err(new NotGroupMemberError());

  const drafts = await deps.draftRepo.findByGroupIdAndAuthorId(input.groupId, input.authorId);
  return ok(drafts.map(toDto));
}

export type DeleteDraftInput = {
  draftId: string;
  authorId: string;
};

export async function deleteDraft(
  input: DeleteDraftInput,
  deps: {
    draftRepo: DraftRepository;
  },
): Promise<Result<void, DomainError>> {
  const existing = await deps.draftRepo.findById(input.draftId);
  if (!existing) return err(new NotFoundError('Draft'));
  if (existing.authorId !== input.authorId) {
    return err(new UnauthorizedError('Draft does not belong to user'));
  }

  await deps.draftRepo.deleteByIdAndAuthorId(input.draftId, input.authorId);
  return ok(undefined);
}
