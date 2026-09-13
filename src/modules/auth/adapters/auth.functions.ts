import { auth, clerkClient } from '@clerk/tanstack-react-start/server';
import { createServerFn } from '@tanstack/react-start';

import { createUseCases } from '#/composition.js';
import { protectedMiddleware } from '#/shared/infrastructure/auth/protectedMiddleware.js';

export const getCurrentUserFn = createServerFn({ method: 'GET' }).handler(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);

  const email = clerkUser.emailAddresses[0]?.emailAddress ?? '';
  const username = clerkUser.username ?? undefined;
  const avatarUrl = clerkUser.imageUrl ?? undefined;

  const { syncClerkUser } = createUseCases();
  const user = await syncClerkUser({ id: userId, email, username, avatarUrl });
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
});

export const getUserIdFn = createServerFn({ method: 'GET' })
  .middleware([protectedMiddleware])
  .handler(async ({ context }) => {
    return { userId: context.userId };
  });
