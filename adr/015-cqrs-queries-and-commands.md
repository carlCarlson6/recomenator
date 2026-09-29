# ADR 015: CQRS Refactor — Split Modules into Queries and Commands

## Status

**Accepted / Implemented**

Supersedes the read-path aspects of [ADR 014](./014-username-resync-from-clerk-on-display-name-reads.md).

## Context

Recomenator is read-heavy: most traffic is timelines, post detail, interactions, and unread
badges. The previous architecture organised everything into vertical slices
(`modules/{auth,groups,posts,notifications}`) each with `domain` / `application` /
`infrastructure` / `adapters` / `ui`. Read use cases were built on top of write-side domain
repositories, with these recurring problems:

1. **Writes inside reads.** `resyncUserFromClerk` ran inside seven read use cases and could
   issue one Clerk API call per author per page load, then write to the `users` table.
2. **Cross-module coupling in the read path.** `posts` read use cases imported groups'
   `MembershipRepository` and auth's `UserRepository` + resync service.
3. **In-memory joins.** Every post list issued 5 parallel repo calls and stitched maps in
   TypeScript; the same assembly was duplicated across three files.
4. **Duplicated / inconsistent display-name resolution.** `resolveDisplayName` was copy-pasted;
   the reactor list ignored `membership.displayName` entirely.
5. **Reads and commands mixed in files.** e.g. `listTimelinePosts` lived in `CreatePost.ts`,
   `updateDisplayName` lived in `GetGroup.ts`, `getUnreadGroups` wrote to a groups-owned table.
6. **DTO defined on the command side.** `PostDto` lived in `CreatePost.ts` and was imported by
   every query.

## Decisions

### 1. Split `src/modules` into `queries/` and `commands/`

- `src/modules/queries/**` is the read side.
- `src/modules/commands/**` is the write side.
- The top-level `auth` / `groups` / `posts` / `notifications` slices were dissolved into these
  two folders. `posts/replies` and `posts/linkPreview` remain submodules of `commands/posts`.
- Shared feature UI moved to `src/components/` because those components consume read models
  from multiple queries (e.g. `PostCard` is used by timeline, interactions, and post detail).

### 2. Read models are derived from views, including reused UI

One module per read model: `home`, `timeline`, `interactions`, `postDetail`, `reactors`,
`invite`, `drafts`, `groupHeader`. The reused element (`PostCard`) is modelled once as
`PostCardRM` in `queries/shared/postCardQuery.ts` and consumed by three read models.

### 3. Queries are thin Drizzle queries returning plain DTOs

- Each query runs one `db.select()` (or a few parallel selects) that returns its read model.
- No domain entities, no repository ports, no `Result`, and crucially **no writes**.
- The relational API is not used (per project convention); all lookups use `db.select()`.
- Missing resources / non-members throw; violations surface as server-function errors.

### 4. User identity is resolved once, on the read side

`queries/shared/userIdentity.ts` implements the chain:

```
membership.displayName -> Clerk username -> users.email -> 'Anonymous'
```

- The Clerk fallback is **batched** in a single `clerkClient.users.getUserList({ userId })`
  call for only the users missing a display name, then discarded (no cache, no DB write).
- This removes every write from the read path and fixes the reactor-list inconsistency by
  applying one resolution rule everywhere.
- `resolveDisplayNames` accepts an injectable lookup so it is unit-testable without Clerk.

### 5. `users` table stores identity only; Clerk sync simplified

- `users` keeps only `id` + `email`; the table exists to know which users exist and to satisfy
  foreign keys from memberships/posts.
- `SyncClerkUser` upserts `id` + `email` only (still updates email on change).
- `ResyncUserFromClerk`, the `ClerkUserProvider` port, and `TanstackClerkUserProvider` were
  deleted. `username` / `avatar_url` columns remain in the schema (no DB change) but are no
  longer written or read by the app.

### 6. Command side keeps DDD, with read-shaped methods pruned

- Aggregates, value objects, repository ports, and `Result<T, DomainError>` stay on the write
  side.
- Repository ports were pruned to write-path methods only:
  - `UserRepository`: `findById`, `save`
  - `MembershipRepository`: `findByUserAndGroup`, `save`
  - `PostRepository`: `findById`, `save`, `delete`
  - `PostReactionRepository`: `save`, `delete`
  - `DraftRepository`: `findById`, `save`, `deleteByIdAndAuthorId`
  - `ReplyRepository`: `findById`, `save`
- `createPost` no longer depends on `UserRepository`.

### 7. Server functions reshaped to cut round-trips

| View | Before | After |
|---|---|---|
| Home | `listMyGroups` + `getUnreadGroups` | `getHomeDataFn` |
| Timeline | `getGroup` + `listTimelinePosts` + `markGroupAsRead` | `getTimelineFn` + `markGroupAsReadFn` (fired in parallel) |
| Interactions | `getGroup` + `listMyInteractions` | `getInteractionsFn` |
| Post detail | `getPost` + `listReplies` | `getPostDetailFn` |
| Invite | `getInvitePreview` + `getMyMembershipForGroup` (+ auth) | `getInvitePageDataFn` (+ auth) |

`markGroupAsRead` remains a separate command to keep queries pure.

### 8. Bugfix: reply counts exclude soft-deleted replies

The new timeline / interactions / post-detail queries count replies with `deletedAt IS NULL`,
so deleted replies no longer inflate `replyCount`.

### 9. No database structure change

The refactor is code-only; the Drizzle schema and migrations are untouched.

## Consequences

- The read path is pure. No Clerk call in normal operation; a Clerk round-trip happens only for
  users lacking a `membership.displayName`, batched once per query.
- Reads and writes can evolve independently; read models can be reshaped to match views without
  touching aggregates.
- Command side is smaller and free of read concerns; `composition.ts` wires only commands.
- Queries can join across tables freely, so table "ownership" is no longer enforced by repository
  boundaries — an accepted trade-off of CQRS.
- `username` / `avatar_url` are now dead columns in the DB (kept to avoid a schema migration).
- Clerk is a dependency of the read path (fallback). If Clerk were down, resolution degrades to
  email → `'Anonymous'` rather than failing.

## QA checklist

After implementation, verify manually:

1. Home lists groups with correct unread badges; a single group redirects into it.
2. Timeline shows posts with author display names, reaction counts, my reactions, and reply count.
3. Adding/removing a reaction updates counts without a full page reload.
4. A post's replies render as a nested tree; adding/deleting a reply refreshes the detail view.
5. Reaction hover tooltip and reactors sheet show names consistent with post cards.
6. Post detail shows the correct reply count (soft-deleted replies excluded).
7. Joining via invite redirects members straight to the group; non-members see the join form.
8. Settings loads the group name; updating the display name reflects on home.
9. `npm run typecheck`, `npm test`, and `npm run build` all pass.

## References

- `src/modules/queries/shared/userIdentity.ts`
- `src/modules/queries/shared/postCardQuery.ts`
- `src/modules/queries/{home,timeline,interactions,postDetail,reactors,invite,drafts,groupHeader}/`
- `src/modules/commands/{auth,groups,posts,notifications}/`
- `src/components/` (PostCard, ReactionButton, ReactorsModal, CreatePostForm, reply components)
- `src/composition.ts`
- `test/modules/queries/shared/userIdentity.test.ts`
- Supersedes read-path aspects of [ADR 014](./014-username-resync-from-clerk-on-display-name-reads.md)
