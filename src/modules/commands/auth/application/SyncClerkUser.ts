import { User } from '../domain/User.js';
import type { UserRepository } from '../domain/ports/UserRepository.js';

export type SyncClerkUserInput = {
  id: string;
  email: string;
};

export async function syncClerkUser(
  input: SyncClerkUserInput,
  deps: { userRepo: UserRepository },
): Promise<User> {
  const existing = await deps.userRepo.findById(input.id);
  if (existing) {
    const shouldUpdate = input.email !== existing.email;
    if (!shouldUpdate) return existing;

    const updated = User.reconstitute({
      id: existing.id,
      email: input.email,
      username: existing.username,
      avatarUrl: existing.avatarUrl,
      createdAt: existing.createdAt,
    });
    await deps.userRepo.save(updated);
    return updated;
  }

  const user = User.create({ id: input.id, email: input.email });
  await deps.userRepo.save(user);
  return user;
}
