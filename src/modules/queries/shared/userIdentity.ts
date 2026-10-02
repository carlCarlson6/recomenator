import { clerkClient } from '@clerk/tanstack-react-start/server';

export type ClerkIdentity = {
  name: string;
};

export type ClerkIdentityLookup = (userIds: string[]) => Promise<Map<string, ClerkIdentity>>;

export async function defaultClerkIdentityLookup(
  userIds: string[],
): Promise<Map<string, ClerkIdentity>> {
  const map = new Map<string, ClerkIdentity>();
  try {
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({ userId: userIds });
    for (const cu of clerkUsers.data) {
      map.set(cu.id, {
        name: cu.username ?? cu.emailAddresses[0]?.emailAddress ?? 'Anonymous',
      });
    }
  } catch {
    // fall through to email/Anonymous and no avatar
  }
  return map;
}

export type ResolvedIdentity = {
  displayName: string;
  avatarUrl: string | null;
};

type PendingIdentity = {
  displayName: string | null;
  avatarUrl: string | null;
};

export async function resolveIdentities(
  items: Array<{
    userId: string;
    displayName?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  }>,
  lookup: ClerkIdentityLookup = defaultClerkIdentityLookup,
): Promise<Map<string, ResolvedIdentity>> {
  const identities = new Map<string, PendingIdentity>();
  const emailFallbacks = new Map<string, string>();
  const missingUserIds = new Set<string>();

  for (const item of items) {
    const current = identities.get(item.userId) ?? { displayName: null, avatarUrl: null };
    if (!current.displayName && item.displayName) current.displayName = item.displayName;
    if (!current.avatarUrl && item.avatarUrl) current.avatarUrl = item.avatarUrl;
    identities.set(item.userId, current);

    if (!emailFallbacks.has(item.userId) && item.email) emailFallbacks.set(item.userId, item.email);
    if (!current.displayName) missingUserIds.add(item.userId);
  }

  if (missingUserIds.size > 0) {
    const clerkIdentities = await lookup([...missingUserIds]);
    for (const [userId, clerkIdentity] of clerkIdentities) {
      const current = identities.get(userId) ?? { displayName: null, avatarUrl: null };
      current.displayName ??= clerkIdentity.name;
      identities.set(userId, current);
    }
  }

  const resolved = new Map<string, ResolvedIdentity>();
  for (const [userId, identity] of identities) {
    resolved.set(userId, {
      displayName: identity.displayName ?? emailFallbacks.get(userId) ?? 'Anonymous',
      avatarUrl: identity.avatarUrl,
    });
  }
  return resolved;
}
