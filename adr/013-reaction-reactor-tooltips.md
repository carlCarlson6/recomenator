# ADR 013: Reaction Reactor Tooltips

## Status

**Accepted / Implemented**

## Context

Recommendations already support four reaction types (`interested`, `liked`, `not_liked`, `viewed`) surfaced as counts on each post card. Users wanted to see *who* reacted with a given type, surfaced on hover so it does not clutter the timeline.

This required decisions about:

1. How to fetch and model the list of reactors.
2. How to resolve a human-readable name for each reactor without adding new fields.
3. How to keep the timeline read path cheap.
4. How to handle the existing group join flow, which is the source of per-group display names.

## Decisions

### 1. On-demand fetch via a dedicated server function

- The list of reactors is **not** embedded in the existing post DTO used by timelines and post detail.
- A new `listPostReactorsFn` server function returns reactors for a single `(postId, type)` pair.
- The UI fetches this data only when the user hovers over a reaction button that has a count greater than zero.
- This keeps the hot timeline query unchanged and avoids loading reactor names for posts the user never inspects.

### 2. New `ListPostReactors` use case

- Lives in the `posts` application layer.
- Validates that the post exists and that the requester is a member of the group.
- Returns reactors sorted by reaction time, **newest first**.
- Reuses the existing `PostReactionRepository` extended with `findByPostIdAndType`.

### 3. Shared user read model for display names

- Introduced `UserReadModel` as a shared read-model port (`src/shared/read-models/UserReadModel.ts`).
- Implemented by `DrizzleUserReadModel` in the auth infrastructure.
- The read model resolves `userId -> displayName` with the fallback chain:
  ```
  username -> email -> 'Anonymous'
  ```
- This avoids coupling the posts module to the auth aggregate repository and avoids a database migration for a Clerk-provided `name` field.

### 4. No Clerk `name` column

- We considered adding a `name` column to `users` and syncing it from Clerk (`firstName + lastName` or `fullName`).
- Rejected to avoid a migration and because the existing `username`/`email` fallback is sufficient for the MVP.
- If richer names become important later, we can revisit the migration.

### 5. Group display names remain mandatory

- Reviewed the join flow: display names are already mandatory at the UI (`required` + `maxLength`), server function validator (`z.string().min(1).max(50).trim()`), and domain (`Membership.create`).
- Added an explicit unit test proving empty/whitespace display names are rejected, so this behavior is regression-protected.
- Per-group display names continue to be used for **authors** of posts and replies, but reactor tooltips intentionally use the read-model fallback chain above to keep the read model generic and simple.

### 6. Tooltip UX

- Implemented a lightweight `Tooltip` component (`src/shared/ui/Tooltip.tsx`) without adding a third-party library.
- Reaction counts of zero produce no tooltip.
- Tooltip shows a vertical list of display names.
- The button remains clickable for toggling the reaction.
- Cache invalidation targets the per-type reactor query when reactions are added or removed.
- No real-time updates: data is fresh on the next hover after a mutation invalidates the cache.

## Consequences

- Timeline and interactions queries remain unchanged and performant.
- Reactor data is loaded lazily, which is ideal for the expected usage pattern (occasional hover).
- The shared read model gives a clean place for cross-module user display resolution.
- Reactor names may be less friendly than per-group display names if a user has no username; this is accepted for the MVP.
- The tooltip is intentionally minimal and does not include accessibility attributes or click-through to profiles.

## QA checklist

After implementation, verify manually:

### Reaction reactor tooltip
1. Hover a reaction with count `0` -> no tooltip appears; button still toggles.
2. Hover a reaction with count `1` -> tooltip shows that user's resolved display name.
3. Hover a reaction with count `>1` -> tooltip shows all names, newest reaction first.
4. After you react, hover -> your name appears in the list like any other user.
5. After removing your reaction, hover -> your name is gone.
6. A reactor with only a username -> username shown.
7. A reactor with no username but an email -> email shown.
8. A reactor with neither -> "Anonymous" shown.
9. A non-group member cannot call `listPostReactorsFn`.
10. Tooltip works on timeline, post detail, and My interactions pages.

### Group join display name
11. Submit join form with empty display name -> blocked by client.
12. Submit whitespace-only display name -> rejected by server/domain validation.
13. Join with valid display name -> succeeds.

### General
14. No console errors after hovering multiple reactions.
15. On touch devices, reaction buttons still toggle and tooltip does not break the UI.

## References

- `src/shared/read-models/UserReadModel.ts`
- `src/modules/auth/infrastructure/DrizzleUserReadModel.ts`
- `src/modules/posts/application/ListPostReactors.ts`
- `src/modules/posts/domain/ports/PostReactionRepository.ts`
- `src/modules/posts/infrastructure/DrizzlePostReactionRepository.ts`
- `src/modules/posts/adapters/posts.functions.ts`
- `src/modules/posts/ui/ReactionButton.tsx`
- `src/modules/posts/ui/PostCard.tsx`
- `src/shared/ui/Tooltip.tsx`
- `src/composition.ts`
- `test/modules/posts/application/ListPostReactors.test.ts`
- `test/modules/groups/application/JoinGroup.test.ts`
