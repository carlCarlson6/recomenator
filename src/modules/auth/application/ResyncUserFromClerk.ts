import { User } from '../domain/User.js';
import type { UserRepository } from '../domain/ports/UserRepository.js';
import type { ClerkUserProvider } from './ports/ClerkUserProvider.js';

export type ResyncUserFromClerk = (
  input: { userId: string },
) => Promise<User | null>;

export async function resyncUserFromClerk(
  input: { userId: string },
  deps: {
    userRepo: UserRepository;
    clerkUserProvider: ClerkUserProvider;
  },
): Promise<User | null> {
  const user = await deps.userRepo.findById(input.userId);
  if (!user) return null;

  if (user.username) return user;

  const username = await deps.clerkUserProvider.getUsername(input.userId);
  if (!username) return user;

  const updated = User.reconstitute({
    id: user.id,
    email: user.email,
    username,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  });

  await deps.userRepo.save(updated);
  return updated;
}

export async function resyncUser(
  user: User | null,
  resyncUserFromClerk: ResyncUserFromClerk,
): Promise<User | null> {
  if (!user || user.username) return user;
  return (await resyncUserFromClerk({ userId: user.id })) ?? user;
}

export async function resyncUsers(
  users: User[],
  resyncUserFromClerk: ResyncUserFromClerk,
): Promise<User[]> {
  return Promise.all(
    users.map(async (user) => {
      if (user.username) return user;
      const resynced = await resyncUserFromClerk({ userId: user.id });
      return resynced ?? user;
    }),
  );
}
