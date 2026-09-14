import { describe, expect, it } from 'vitest';

import { Draft } from '../../../../src/modules/posts/domain/Draft.js';

describe('Draft', () => {
  it('creates a draft with all fields', () => {
    const result = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MOVIES',
      title: 'Inception',
      description: 'A dream within a dream',
      externalUrl: 'https://example.com',
      rating: 9,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.id.startsWith('drf_')).toBe(true);
    expect(result.value.groupId).toBe('grp_1');
    expect(result.value.authorId).toBe('usr_1');
    expect(result.value.category).toBe('MOVIES');
    expect(result.value.title).toBe('Inception');
    expect(result.value.description).toBe('A dream within a dream');
    expect(result.value.externalUrl).toBe('https://example.com');
    expect(result.value.rating).toBe(9);
  });

  it('creates a draft with only required fields', () => {
    const result = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MISC',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.title).toBeNull();
    expect(result.value.description).toBeNull();
    expect(result.value.externalUrl).toBeNull();
    expect(result.value.rating).toBeNull();
  });

  it('normalizes whitespace-only optional fields to null', () => {
    const result = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MISC',
      title: '   ',
      description: '\t\n',
      externalUrl: '  ',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.title).toBeNull();
    expect(result.value.description).toBeNull();
    expect(result.value.externalUrl).toBeNull();
  });

  it('rejects a title that is too long', () => {
    const result = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MISC',
      title: 'a'.repeat(201),
    });

    expect(result.ok).toBe(false);
  });

  it('rejects a description that is too long', () => {
    const result = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MISC',
      description: 'a'.repeat(2001),
    });

    expect(result.ok).toBe(false);
  });

  it('rejects a rating below 1', () => {
    const result = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MISC',
      rating: 0,
    });

    expect(result.ok).toBe(false);
  });

  it('rejects a rating above 10', () => {
    const result = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MISC',
      rating: 11,
    });

    expect(result.ok).toBe(false);
  });

  it('rejects a non-integer rating', () => {
    const result = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MISC',
      rating: 7.5,
    });

    expect(result.ok).toBe(false);
  });

  it('updates fields and refreshes updatedAt', () => {
    const created = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MISC',
      title: 'Old title',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = created.value.update({
      category: 'BOOKS',
      title: 'New title',
      rating: 8,
    });

    expect(updated.ok).toBe(true);
    if (!updated.ok) return;

    expect(updated.value.id).toBe(created.value.id);
    expect(updated.value.category).toBe('BOOKS');
    expect(updated.value.title).toBe('New title');
    expect(updated.value.rating).toBe(8);
    expect(updated.value.updatedAt.getTime()).toBeGreaterThanOrEqual(
      created.value.updatedAt.getTime(),
    );
  });

  it('preserves createdAt when updating', () => {
    const created = Draft.create({
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MISC',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = created.value.update({ category: 'MOVIES' });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;

    expect(updated.value.createdAt).toEqual(created.value.createdAt);
  });

  it('reconstitutes a draft', () => {
    const draft = Draft.reconstitute({
      id: 'drf_1',
      groupId: 'grp_1',
      authorId: 'usr_1',
      category: 'MUSIC',
      title: 'Discovery',
      description: null,
      externalUrl: null,
      rating: 10,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    expect(draft.id).toBe('drf_1');
    expect(draft.title).toBe('Discovery');
    expect(draft.rating).toBe(10);
  });
});
