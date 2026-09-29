import { clerkClient } from '@clerk/tanstack-react-start/server';

export type ClerkNameLookup = (userIds: string[]) => Promise<Map<string, string>>;

export async function defaultClerkNameLookup(userIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  try {
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({ userId: userIds });
    for (const cu of clerkUsers.data) {
      map.set(cu.id, cu.username ?? cu.emailAddresses[0]?.emailAddress ?? 'Anonymous');
    }
  } catch {
    // fall through to email/Anonymous fallback
  }
  return map;
}

export async function resolveDisplayNames(
  items: Array<{ userId: string; displayName?: string | null; email?: string | null }>,
  lookup: ClerkNameLookup = defaultClerkNameLookup,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const missingUserIds: string[] = [];

  for (const item of items) {
    if (item.displayName) {
      map.set(item.userId, item.displayName);
    } else {
      missingUserIds.push(item.userId);
    }
  }

  if (missingUserIds.length > 0) {
    const clerkNames = await lookup([...new Set(missingUserIds)]);
    for (const [userId, name] of clerkNames) {
      map.set(userId, name);
    }
  }

  for (const item of items) {
    if (!map.has(item.userId)) {
      map.set(item.userId, item.email ?? 'Anonymous');
    }
  }

  return map;
}
