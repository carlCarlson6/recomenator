# ADR 014: Username Resync from Clerk on Display-Name Reads

## Status

**Accepted / Implemented**

## Context

User records are created or updated via `SyncClerkUser` when a user signs in through Clerk. Despite that, some stored users ended up with a `null` username while Clerk did contain one. This produced unfriendly display names in the UI (falling back to email or a generic placeholder) even though a username was available in Clerk.

We needed a mechanism that, whenever the app resolves a display name for the UI, tries to fetch a missing username from Clerk and persists it so future reads are self-sufficient.

## Decisions

### 1. Use case, not repository

- We deliberately avoided putting the Clerk call inside `DrizzleUserRepository`.
- A repository should only mediate aggregate persistence; calling an external HTTP API from a repository would break inward-pointing dependencies in the hexagonal architecture.
- The resync logic lives in a dedicated application use case: `ResyncUserFromClerk`.

### 2. New `ClerkUserProvider` port

- `src/modules/auth/application/ports/ClerkUserProvider.ts` defines a narrow port: `getUsername(userId): Promise<string | null>`.
- `TanstackClerkUserProvider` implements it using `@clerk/tanstack-react-start/server`.
- The implementation swallows errors and returns `null`, so a failing Clerk call never breaks the read path.

### 3. `ResyncUserFromClerk` behavior

- Loads the user via `UserRepository.findById`.
- If the user already has a username, returns immediately without calling Clerk.
- If the username is missing, calls `ClerkUserProvider.getUsername`.
- If Clerk returns a username, reconstitutes the user, persists the update, and returns the updated user.
- If Clerk returns nothing or fails, returns the original user unchanged.
- Shared helpers `resyncUser` and `resyncUsers` make it easy for callers to resync one or many users without duplicating the null-check logic.

### 4. Resync at every display-name read path

The use case is invoked wherever the app resolves a human-readable author/reactor name:

- `CreatePost.createPost`
- `CreatePost.listTimelinePosts`
- `GetPost.getPost`
- `ListMyInteractions.listMyInteractions`
- `ReplyUseCases.addReply`
- `ReplyUseCases.listReplies`
- `ListPostReactors.listPostReactors`

This guarantees that recommendation cards, replies, reactions, and the interactions view always attempt to show a username when Clerk has one.

### 5. No throttling or last-synced timestamp

- We always resync on read when the username is missing.
- The rationale: if a username is missing, either Clerk has none (so the call returns quickly with `null`) or we need to backfill it once. After the first successful resync the stored username is present, so subsequent reads short-circuit without calling Clerk.
- No `lastSyncedAt` column or TTL was added to keep the change minimal.

### 6. Unified fallback to `'Unknown'`

- The previous `UserReadModel` used for reactor names fell back to `'Anonymous'`.
- All display-name resolution now uses the same fallback chain:
  ```
  membership.displayName -> username -> email -> 'Unknown'
  ```
- This removes the `'Anonymous'`/'`Unknown'` split and makes reactor names consistent with post/reply author names.

### 7. Removed `UserReadModel`

- `ListPostReactors` was the only consumer of the shared `UserReadModel`.
- It now uses `UserRepository` directly and resyncs missing usernames like the other display-name paths.
- The `UserReadModel` port and its Drizzle implementation were deleted to eliminate dead code.

## Consequences

- Display-name reads can now write to the `users` table. The mutation is explicit (inside a use case) but read paths are no longer pure reads.
- Every read for a user without a username triggers one Clerk API call. Once backfilled, no further Clerk calls occur for that user.
- Bulk reads (e.g., a timeline with many distinct authors lacking usernames) may fan out into many parallel Clerk calls. This is accepted for the current volume.
- The `ClerkUserProvider` port keeps the auth module testable without a real Clerk client.

## QA checklist

After implementation, verify manually:

1. A user with a stored username is displayed by username on post cards, replies, reactions, and interactions.
2. A user without a stored username but with one in Clerk is backfilled and displayed by username on the next relevant page load.
3. A user without a username in Clerk falls back to email, then to `'Unknown'`.
4. Reactor names in the tooltip/sheet use `'Unknown'` instead of `'Anonymous'` when no name is available.
5. Turning Clerk off or simulating a failure does not crash display-name reads; the UI falls back gracefully.
6. `npm test` passes, including the new `ResyncUserFromClerk` tests.

## References

- `src/modules/auth/application/ports/ClerkUserProvider.ts`
- `src/modules/auth/infrastructure/TanstackClerkUserProvider.ts`
- `src/modules/auth/application/ResyncUserFromClerk.ts`
- `src/composition.ts`
- `src/modules/posts/application/CreatePost.ts`
- `src/modules/posts/application/GetPost.ts`
- `src/modules/posts/application/ListMyInteractions.ts`
- `src/modules/posts/application/ListPostReactors.ts`
- `src/modules/posts/replies/application/ReplyUseCases.ts`
- `test/modules/auth/application/ResyncUserFromClerk.test.ts`
- `test/modules/posts/application/ListPostReactors.test.ts`
- `test/modules/posts/application/ListMyInteractions.test.ts`
- `test/modules/posts/replies/application/ReplyUseCases.test.ts`
