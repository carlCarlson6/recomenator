import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  onConflictDoUpdate: vi.fn(),
}));

vi.mock('#/shared/infrastructure/db/client.js', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoUpdate: mocks.onConflictDoUpdate,
      })),
    })),
  },
}));

import { Post } from '#/modules/commands/posts/domain/Post.js';
import { DrizzlePostRepository } from '#/modules/commands/posts/infrastructure/DrizzlePostRepository.js';

function createPost(category: 'MOVIES' | 'MUSIC'): Post {
  const result = Post.create({
    groupId: 'grp_1',
    authorId: 'usr_1',
    category,
    title: 'Inception',
  });
  if (!result.ok) throw new Error('failed to create post');
  return result.value;
}

describe('DrizzlePostRepository', () => {
  beforeEach(() => {
    mocks.onConflictDoUpdate.mockClear();
  });

  it('includes the category in the upsert update so edits persist', async () => {
    const repo = new DrizzlePostRepository();

    await repo.save(createPost('MUSIC'));

    expect(mocks.onConflictDoUpdate).toHaveBeenCalledTimes(1);
    const [conflict] = mocks.onConflictDoUpdate.mock.calls[0];
    expect(conflict.set).toMatchObject({ category: 'MUSIC' });
  });
});
