# ADR 007: Group Interaction History View and Vercel Observability

## Status

**Accepted / Implemented**

## Context

Users wanted a dedicated place to review their own activity inside a group: the recommendations they had marked as liked, not liked, interested, or viewed. They also wanted to filter that history by category and reaction type. At the same time, we wanted basic production observability via Vercel Analytics and Speed Insights.

## Decisions

### 1. Group-scoped interaction history

- The view lives at `/groups/$groupId/interactions` and is reachable from the group bottom navigation bar.
- It is scoped to the current group and shows only the current user's own reactions.
- The list reuses `PostCard` so the card behavior (reaction toggles, reply link, preview rendering) is identical to the group timeline.
- Posts are sorted by the user's most recent reaction to each post, newest first.
- A post appears only once even if the user has multiple reactions on it; all of the user's reaction types for that post are shown on the card.
- Removing the last relevant reaction from this view causes the card to disappear after the mutation succeeds.

### 2. Filtering

- Two multi-select chip filters are shown: category and reaction type.
- The default state shows all categories and all reaction types.
- Filters are applied in SQL by joining `post_reactions` with `posts` and filtering on `posts.category` and `post_reactions.type`.

### 3. Data model changes

- A new index `post_reactions_user_id_type_created_at_idx` is added on `(user_id, type, created_at)` to support efficient lookups of a user's reactions.
- New repository methods:
  - `PostReactionRepository.findByUserIdAndGroupId` joins `post_reactions` and `posts` to return a user's reactions with SQL-level category and type filtering.
  - `PostRepository.findByIds` fetches a batch of posts by ID for DTO assembly.
- A new `listMyInteractions` use case orchestrates membership verification, reaction lookup, post loading, aggregate reaction counts, reply counts, and author display-name resolution.

### 4. TanStack Query invalidation

- `PostCard` now invalidates the `['groups', groupId, 'interactions']` query family after reaction mutations so the history view stays consistent when users toggle reactions from either page.

### 5. Vercel Analytics and Speed Insights

- Added `@vercel/analytics` and `@vercel/speed-insights` React packages.
- Both components are rendered in `src/routes/__root.tsx` inside the document body.
- No custom events, environment gating, or additional configuration is implemented; Vercel injects the project binding automatically at deploy time.

## Consequences

- Users can easily review and manage their past reactions inside each group.
- Reusing `PostCard` keeps the UI consistent and minimizes duplicated card logic.
- SQL filtering and the new index keep the history query efficient for the expected volume of reactions per user.
- Reaction toggles from either the timeline or the interactions page invalidate both query families, avoiding stale state.
- Analytics and Speed Insights provide baseline production telemetry without custom instrumentation.

## References

- `src/shared/infrastructure/db/schema.ts`
- `src/modules/posts/domain/ports/PostReactionRepository.ts`
- `src/modules/posts/infrastructure/DrizzlePostReactionRepository.ts`
- `src/modules/posts/domain/ports/PostRepository.ts`
- `src/modules/posts/infrastructure/DrizzlePostRepository.ts`
- `src/modules/posts/application/ListMyInteractions.ts`
- `src/modules/posts/adapters/posts.functions.ts`
- `src/modules/posts/ui/PostCard.tsx`
- `src/routes/groups/$groupId/interactions.tsx`
- `src/routes/groups/$groupId/index.tsx`
- `src/composition.ts`
- `src/routes/__root.tsx`
- `test/modules/posts/application/ListMyInteractions.test.ts`
- `drizzle/0002_married_speed.sql`
