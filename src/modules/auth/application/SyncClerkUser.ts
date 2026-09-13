import { User } from '../domain/User.js';
import type { UserRepository } from '../domain/ports/UserRepository.js';

export type SyncClerkUserInput = {
  id: string;
  email: string;
  username?: string | null;
  avatarUrl?: string | null;
};

export async function syncClerkUser(
  input: SyncClerkUserInput,
  deps: { userRepo: UserRepository },
): Promise<User> {
  const existing = await deps.userRepo.findById(input.id);
  if (existing) {
    const shouldUpdate =
      input.username !== undefined && existing.username !== input.username;
    if (!shouldUpdate) return existing;

    const updated = User.reconstitute({
      id: existing.id,
      email: existing.email,
      username: input.username ?? existing.username,
      avatarUrl: existing.avatarUrl,
      createdAt: existing.createdAt,
    });
    await deps.userRepo.save(updated);
    return updated;
  }

  const user = User.create(input);
  await deps.userRepo.save(user);
  return user;
}
