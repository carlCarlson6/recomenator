# ADR 005: Post Ratings, Reactions, Author Display Names, and Style Pass

## Status

**Accepted / Implemented**

## Context

Users wanted three functional improvements to recommendations and a visual polish pass:

1. Authors should be able to add a numeric rating when creating a recommendation.
2. Other group members should be able to react to a recommendation with `interested`, `liked`, `not_liked`, or `viewed`.
3. The recommendation list should show the author's display name.
4. The overall visual style needed better contrast, a more saturated palette, and a monospace typeface.

These changes touch the domain model, database schema, read models, and UI, so they needed a coherent design decision.

## Decisions

### 1. Rating model

- Ratings are optional integers from 1 to 10.
- The same 1–10 scale applies to every category (`VIDEO_GAMES`, `MOVIES`, `SHOWS`, `MUSIC`, `MISC`).
- The rating is set by the author at creation time and is not editable later.
- The rating is stored on the `posts` table as a nullable integer with a database check constraint.
- The `Post` aggregate validates the rating in `Post.create`.
- The rating is displayed as a numeric badge (e.g. **8/10**) on the post card; it is hidden when absent.

### 2. Reaction model

- Reactions live in a new `post_reactions` table with columns `post_id`, `user_id`, and `type`.
- A unique index on `(post_id, user_id, type)` enforces one reaction of each type per user per post.
- Reactions are non-exclusive: a user can mark a post as both `liked` and `viewed`.
- Users can add or remove their own reactions at any time.
- Reactions are anonymous in aggregate: the API returns only counts per type.
- The API also returns the current user's own reaction types so the UI can show toggle state.
- Authors may react to their own posts.
- Reactions are modeled inside the existing `posts` vertical slice rather than as a separate module.

### 3. Author display names

- Posts and replies show the author's per-group display name from `memberships.display_name`.
- If the author has no display name in the group, the UI falls back to the Clerk `username`, which is now synced to `users.username` during `SyncClerkUser`.
- If no username exists, the fallback chain continues to `users.email` and finally `"Unknown"`.
- Because names are resolved at read time by joining the current `memberships` table, name changes are retroactive on old posts and replies.

### 4. Read-model approach

- `listTimelinePosts`, `getPost`, and `listReplies` now resolve display names and reaction data in the application layer.
- The use cases batch-load group memberships, users, and reaction aggregates to avoid N+1 queries.
- No dedicated read-model table was introduced; the existing repositories are composed in the application use cases.

### 5. Style pass

- The base font stack was switched to a system monospace stack for all text.
- Light-mode tokens were adjusted for stronger contrast: darker foreground, darker muted text, and more visible borders.
- Dark-mode tokens were adjusted similarly: darker background, lighter muted text, and stronger borders.
- Primary accent colors were kept saturated in both modes.

## Consequences

- Recommendation cards now surface more social signal (rating, reactions, author identity) without requiring new screens.
- Reaction counts are anonymous, which keeps the friends-group atmosphere light and avoids exposing who disliked a post.
- The read path for timelines and post details is now a multi-join query. For the expected group sizes this is acceptable; a dedicated read model can be introduced later if performance becomes an issue.
- The monospace typeface and higher-contrast palette give the app a more distinct visual personality.

## References

- `src/shared/infrastructure/db/schema.ts`
- `drizzle/0001_cuddly_justice.sql`
- `src/modules/posts/domain/Post.ts`
- `src/modules/posts/domain/PostReaction.ts`
- `src/modules/posts/application/CreatePost.ts`
- `src/modules/posts/application/GetPost.ts`
- `src/modules/posts/application/PostReactionUseCases.ts`
- `src/modules/posts/infrastructure/DrizzlePostReactionRepository.ts`
- `src/modules/posts/adapters/posts.functions.ts`
- `src/modules/posts/ui/PostCard.tsx`
- `src/modules/posts/ui/CreatePostForm.tsx`
- `src/modules/replies/application/ReplyUseCases.ts`
- `src/modules/replies/ui/ReplyList.tsx`
- `src/modules/auth/domain/User.ts`
- `src/modules/auth/application/SyncClerkUser.ts`
- `src/composition.ts`
- `src/styles.css`
- `test/modules/posts/domain/Post.test.ts`
- `test/modules/posts/domain/PostReaction.test.ts`
