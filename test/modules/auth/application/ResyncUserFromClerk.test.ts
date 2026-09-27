import { describe, expect, it } from 'vitest';

import { resyncUserFromClerk } from '../../../../src/modules/auth/application/ResyncUserFromClerk.js';
import { User } from '../../../../src/modules/auth/domain/User.js';
import type { UserRepository } from '../../../../src/modules/auth/domain/ports/UserRepository.js';
import type { ClerkUserProvider } from '../../../../src/modules/auth/application/ports/ClerkUserProvider.js';

class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async findByIds(ids: string[]): Promise<User[]> {
    return ids.map((id) => this.users.get(id)).filter((u): u is User => u !== undefined);
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  add(user: User): void {
    this.users.set(user.id, user);
  }
}

class InMemoryClerkUserProvider implements ClerkUserProvider {
  private usernames: Map<string, string | null> = new Map();
  private shouldThrow = false;

  setUsername(userId: string, username: string | null): void {
    this.usernames.set(userId, username);
  }

  setShouldThrow(value: boolean): void {
    this.shouldThrow = value;
  }

  async getUsername(userId: string): Promise<string | null> {
    if (this.shouldThrow) return null;
    return this.usernames.get(userId) ?? null;
  }
}

function createDeps() {
  const userRepo = new InMemoryUserRepository();
  const clerkUserProvider = new InMemoryClerkUserProvider();
  return { userRepo, clerkUserProvider };
}

describe('ResyncUserFromClerk', () => {
  it('returns null when the user does not exist', async () => {
    const deps = createDeps();

    const result = await resyncUserFromClerk({ userId: 'usr_missing' }, deps);

    expect(result).toBeNull();
  });

  it('returns the user unchanged when a username is already set', async () => {
    const deps = createDeps();
    const user = User.create({ id: 'usr_1', email: 'a@b.com', username: 'alice' });
    deps.userRepo.add(user);
    deps.clerkUserProvider.setUsername('usr_1', 'clerk_alice');

    const result = await resyncUserFromClerk({ userId: 'usr_1' }, deps);

    expect(result).not.toBeNull();
    expect(result!.username).toBe('alice');

    const stored = await deps.userRepo.findById('usr_1');
    expect(stored!.username).toBe('alice');
  });

  it('fetches and persists the username from Clerk when missing', async () => {
    const deps = createDeps();
    const user = User.create({ id: 'usr_1', email: 'a@b.com' });
    deps.userRepo.add(user);
    deps.clerkUserProvider.setUsername('usr_1', 'alice');

    const result = await resyncUserFromClerk({ userId: 'usr_1' }, deps);

    expect(result).not.toBeNull();
    expect(result!.username).toBe('alice');

    const stored = await deps.userRepo.findById('usr_1');
    expect(stored!.username).toBe('alice');
  });

  it('returns the user unchanged when Clerk has no username', async () => {
    const deps = createDeps();
    const user = User.create({ id: 'usr_1', email: 'a@b.com' });
    deps.userRepo.add(user);

    const result = await resyncUserFromClerk({ userId: 'usr_1' }, deps);

    expect(result).not.toBeNull();
    expect(result!.username).toBeNull();

    const stored = await deps.userRepo.findById('usr_1');
    expect(stored!.username).toBeNull();
  });

  it('returns the user unchanged when the Clerk call fails', async () => {
    const deps = createDeps();
    const user = User.create({ id: 'usr_1', email: 'a@b.com' });
    deps.userRepo.add(user);
    deps.clerkUserProvider.setShouldThrow(true);

    const result = await resyncUserFromClerk({ userId: 'usr_1' }, deps);

    expect(result).not.toBeNull();
    expect(result!.username).toBeNull();

    const stored = await deps.userRepo.findById('usr_1');
    expect(stored!.username).toBeNull();
  });
});
