import { describe, expect, it } from 'vitest';

import { saveDraft, listDrafts, deleteDraft } from '../../../../src/modules/posts/application/DraftUseCases.js';
import { Draft } from '../../../../src/modules/posts/domain/Draft.js';
import { Membership } from '../../../../src/modules/groups/domain/Membership.js';
import type { DraftRepository } from '../../../../src/modules/posts/domain/ports/DraftRepository.js';
import type { MembershipRepository } from '../../../../src/modules/groups/domain/ports/MembershipRepository.js';
import type { Category } from '../../../../src/shared/infrastructure/db/schema.js';

class InMemoryDraftRepository implements DraftRepository {
  private drafts: Map<string, Draft> = new Map();

  async findById(id: string): Promise<Draft | null> {
    return this.drafts.get(id) ?? null;
  }

  async findByGroupIdAndAuthorId(groupId: string, authorId: string): Promise<Draft[]> {
    return Array.from(this.drafts.values())
      .filter((d) => d.groupId === groupId && d.authorId === authorId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async save(draft: Draft): Promise<void> {
    this.drafts.set(draft.id, draft);
  }

  async deleteByIdAndAuthorId(id: string, authorId: string): Promise<void> {
    const draft = this.drafts.get(id);
    if (draft && draft.authorId === authorId) {
      this.drafts.delete(id);
    }
  }

  add(draft: Draft): void {
    this.drafts.set(draft.id, draft);
  }
}

class InMemoryMembershipRepository implements MembershipRepository {
  private memberships: Membership[] = [];

  async findByUserAndGroup(userId: string, groupId: string): Promise<Membership | null> {
    return this.memberships.find((m) => m.userId === userId && m.groupId === groupId) ?? null;
  }

  async findByUserId(): Promise<never[]> {
    return [];
  }

  async findByGroupId(): Promise<Membership[]> {
    return this.memberships;
  }

  async save(membership: Membership): Promise<void> {
    const index = this.memberships.findIndex((m) => m.id === membership.id);
    if (index >= 0) {
      this.memberships[index] = membership;
    } else {
      this.memberships.push(membership);
    }
  }

  add(membership: Membership): void {
    this.memberships.push(membership);
  }
}

function createDeps() {
  return {
    draftRepo: new InMemoryDraftRepository(),
    membershipRepo: new InMemoryMembershipRepository(),
  };
}

async function addMembership(deps: ReturnType<typeof createDeps>, userId: string, groupId: string) {
  const membership = Membership.create({ userId, groupId, displayName: 'Alice' });
  expect(membership.ok).toBe(true);
  if (!membership.ok) return;
  deps.membershipRepo.add(membership.value);
}

describe('saveDraft', () => {
  it('creates a new draft for a group member', async () => {
    const deps = createDeps();
    await addMembership(deps, 'usr_1', 'grp_1');

    const result = await saveDraft(
      {
        groupId: 'grp_1',
        authorId: 'usr_1',
        category: 'MOVIES' as Category,
        title: 'Inception',
        rating: 9,
      },
      deps,
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.title).toBe('Inception');
    expect(result.value.rating).toBe(9);
    expect(result.value.id.startsWith('drf_')).toBe(true);
  });

  it('updates an existing draft when draftId is provided', async () => {
    const deps = createDeps();
    await addMembership(deps, 'usr_1', 'grp_1');

    const created = await saveDraft(
      {
        groupId: 'grp_1',
        authorId: 'usr_1',
        category: 'MISC' as Category,
        title: 'Old',
      },
      deps,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = await saveDraft(
      {
        draftId: created.value.id,
        groupId: 'grp_1',
        authorId: 'usr_1',
        category: 'BOOKS' as Category,
        title: 'New',
        rating: 8,
      },
      deps,
    );

    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.value.id).toBe(created.value.id);
    expect(updated.value.category).toBe('BOOKS');
    expect(updated.value.title).toBe('New');
    expect(updated.value.rating).toBe(8);
  });

  it('rejects saving a draft for a non-member', async () => {
    const deps = createDeps();

    const result = await saveDraft(
      {
        groupId: 'grp_1',
        authorId: 'usr_1',
        category: 'MISC' as Category,
        title: 'Inception',
      },
      deps,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_GROUP_MEMBER');
  });

  it('rejects updating a draft owned by another user', async () => {
    const deps = createDeps();
    await addMembership(deps, 'usr_1', 'grp_1');
    await addMembership(deps, 'usr_2', 'grp_1');

    const created = await saveDraft(
      {
        groupId: 'grp_1',
        authorId: 'usr_1',
        category: 'MISC' as Category,
        title: 'Mine',
      },
      deps,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const result = await saveDraft(
      {
        draftId: created.value.id,
        groupId: 'grp_1',
        authorId: 'usr_2',
        category: 'MISC' as Category,
        title: 'Yours',
      },
      deps,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects updating a draft from another group', async () => {
    const deps = createDeps();
    await addMembership(deps, 'usr_1', 'grp_1');
    await addMembership(deps, 'usr_1', 'grp_2');

    const created = await saveDraft(
      {
        groupId: 'grp_1',
        authorId: 'usr_1',
        category: 'MISC' as Category,
        title: 'Mine',
      },
      deps,
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const result = await saveDraft(
      {
        draftId: created.value.id,
        groupId: 'grp_2',
        authorId: 'usr_1',
        category: 'MISC' as Category,
        title: 'Wrong group',
      },
      deps,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('UNAUTHORIZED');
  });
});

describe('listDrafts', () => {
  it('returns drafts sorted by updatedAt descending', async () => {
    const deps = createDeps();
    await addMembership(deps, 'usr_1', 'grp_1');

    const draft1 = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MOVIES',
      title: 'First',
    });
    const draft2 = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MUSIC',
      title: 'Second',
    });
    expect(draft1.ok && draft2.ok).toBe(true);
    if (!draft1.ok || !draft2.ok) return;

    const older = Draft.reconstitute({
      ...draft1.value,
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const newer = Draft.reconstitute({
      ...draft2.value,
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    deps.draftRepo.add(older);
    deps.draftRepo.add(newer);

    const result = await listDrafts({ groupId: 'grp_1', authorId: 'usr_1' }, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.map((d) => d.title)).toEqual(['Second', 'First']);
  });

  it('returns only drafts for the given group and author', async () => {
    const deps = createDeps();
    await addMembership(deps, 'usr_1', 'grp_1');

    const mine = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MISC',
      title: 'Mine',
    });
    const others = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_2',
      category: 'MISC',
      title: 'Other user',
    });
    const otherGroup = Draft.create({
      groupId: 'grp_2',
      authorId: 'usr_1',
      category: 'MISC',
      title: 'Other group',
    });
    expect(mine.ok && others.ok && otherGroup.ok).toBe(true);
    if (!mine.ok || !others.ok || !otherGroup.ok) return;

    deps.draftRepo.add(mine.value);
    deps.draftRepo.add(others.value);
    deps.draftRepo.add(otherGroup.value);

    const result = await listDrafts({ groupId: 'grp_1', authorId: 'usr_1' }, deps);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0].title).toBe('Mine');
  });

  it('rejects listing drafts for a non-member', async () => {
    const deps = createDeps();

    const result = await listDrafts({ groupId: 'grp_1', authorId: 'usr_1' }, deps);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_GROUP_MEMBER');
  });
});

describe('deleteDraft', () => {
  it('deletes a draft owned by the user', async () => {
    const deps = createDeps();
    const draft = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MISC',
      title: 'To delete',
    });
    expect(draft.ok).toBe(true);
    if (!draft.ok) return;
    deps.draftRepo.add(draft.value);

    const result = await deleteDraft({ draftId: draft.value.id, authorId: 'usr_1' }, deps);

    expect(result.ok).toBe(true);
    const remaining = await deps.draftRepo.findById(draft.value.id);
    expect(remaining).toBeNull();
  });

  it('rejects deleting a non-existent draft', async () => {
    const deps = createDeps();

    const result = await deleteDraft({ draftId: 'drf_missing', authorId: 'usr_1' }, deps);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('NOT_FOUND');
  });

  it('rejects deleting a draft owned by another user', async () => {
    const deps = createDeps();
    const draft = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MISC',
      title: 'Mine',
    });
    expect(draft.ok).toBe(true);
    if (!draft.ok) return;
    deps.draftRepo.add(draft.value);

    const result = await deleteDraft({ draftId: draft.value.id, authorId: 'usr_2' }, deps);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('UNAUTHORIZED');
  });
});
