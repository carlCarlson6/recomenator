import { clerkClient } from '@clerk/tanstack-react-start/server';

import type { ClerkUserProvider } from '../application/ports/ClerkUserProvider.js';

export class TanstackClerkUserProvider implements ClerkUserProvider {
  async getUsername(userId: string): Promise<string | null> {
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      return clerkUser.username ?? null;
    } catch {
      return null;
    }
  }
}
