import { User } from '../domain/User.js';
import type { UserRepository } from '../domain/ports/UserRepository.js';

export type SyncClerkUserInput = {
  id: string;
  email: string;
  avatarUrl?: string | null;
};

export async function syncClerkUser(
  input: SyncClerkUserInput,
  deps: { userRepo: UserRepository },
): Promise<User> {
  const existing = await deps.userRepo.findById(input.id);
  if (existing) return existing;

  const user = User.create(input);
  await deps.userRepo.save(user);
  return user;
}
