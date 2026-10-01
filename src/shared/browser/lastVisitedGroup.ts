const STORAGE_KEY = 'recomenator.lastVisitedGroupId';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;

  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

export function rememberLastVisitedGroup(groupId: string): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY, groupId);
  } catch {
    // Storage can fail (private mode, quota); remembering is best-effort.
  }
}

export function readLastVisitedGroupId(): string | null {
  const storage = getStorage();
  if (!storage) return null;

  try {
    return storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function prioritizeLastVisited<T extends { id: string }>(
  groups: T[],
  lastVisitedId: string | null,
): T[] {
  if (!lastVisitedId) return groups;

  const index = groups.findIndex((group) => group.id === lastVisitedId);
  if (index <= 0) return groups;

  const reordered = groups.slice();
  const [lastVisited] = reordered.splice(index, 1);
  reordered.unshift(lastVisited);
  return reordered;
}
