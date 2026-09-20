import { describe, expect, it } from 'vitest';

import { Reply } from '../../../../src/modules/replies/domain/Reply.js';

describe('Reply', () => {
  it('creates a top-level reply', () => {
    const result = Reply.create({
      postId: 'pst_1',
      authorId: 'usr_1',
      content: 'Great recommendation!',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.id).toMatch(/^rpl_/);
    expect(result.value.postId).toBe('pst_1');
    expect(result.value.parentId).toBeNull();
    expect(result.value.deletedAt).toBeNull();
  });

  it('creates a nested reply with a parent', () => {
    const parentResult = Reply.create({
      postId: 'pst_1',
      authorId: 'usr_1',
      content: 'Parent reply',
    });
    expect(parentResult.ok).toBe(true);
    if (!parentResult.ok) return;

    const childResult = Reply.create({
      postId: 'pst_1',
      authorId: 'usr_2',
      content: 'Child reply',
      parentId: parentResult.value.id,
    });

    expect(childResult.ok).toBe(true);
    if (!childResult.ok) return;
    expect(childResult.value.parentId).toBe(parentResult.value.id);
  });

  it('rejects empty content', () => {
    const result = Reply.create({
      postId: 'pst_1',
      authorId: 'usr_1',
      content: '   ',
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });

  it('marks a reply as deleted', () => {
    const result = Reply.create({
      postId: 'pst_1',
      authorId: 'usr_1',
      content: 'To be deleted',
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const deleted = result.value.delete();

    expect(deleted.deletedAt).toBeInstanceOf(Date);
    expect(deleted.content).toBe('To be deleted');
    expect(deleted.parentId).toBeNull();
  });

  it('reconstitutes a reply with parentId and deletedAt', () => {
    const reply = Reply.reconstitute({
      id: 'rpl_1',
      postId: 'pst_1',
      authorId: 'usr_1',
      content: 'Test',
      parentId: 'rpl_parent',
      deletedAt: new Date('2025-01-01'),
      createdAt: new Date('2024-01-01'),
    });

    expect(reply.parentId).toBe('rpl_parent');
    expect(reply.deletedAt).toEqual(new Date('2025-01-01'));
  });
});
