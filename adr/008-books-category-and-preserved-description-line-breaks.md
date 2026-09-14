# ADR 008: Books Category and Preserved Description Line Breaks

## Status

**Accepted / Implemented**

## Context

Users wanted a dedicated category for book recommendations alongside the existing video games, movies, shows, music, and miscellaneous categories. They also reported that multi-line descriptions entered in the recommendation form were collapsed into a single line when displayed, losing the line breaks they had typed.

## Decisions

### 1. New `BOOKS` recommendation category

- Added `BOOKS` to the `Category` union type in `src/shared/infrastructure/db/schema.ts`.
- The category is stored as plain text in the `posts.category` column, consistent with the existing no-Postgres-enum convention.
- Updated Zod validation schemas in `src/modules/posts/adapters/posts.functions.ts` so server functions accept and validate `BOOKS`.
- Added `Books` as a selectable option in:
  - `src/modules/posts/ui/CreatePostForm.tsx`
  - `src/routes/groups/$groupId/index.tsx` (timeline category filter)
  - `src/routes/groups/$groupId/interactions.tsx` (interactions category filter)
- Updated the README project description to mention books.

No database migration is required because the column is an unrestricted `text` type and the TypeScript category type only provides compile-time guarantees.

### 2. Preserve description line breaks

- Changed the description paragraph in `src/modules/posts/ui/PostCard.tsx` to use Tailwind's `whitespace-pre-wrap` utility.
- This keeps existing text wrapping behavior while respecting newline characters entered by users in the description textarea.
- The fix applies everywhere `PostCard` is rendered, including the group timeline and the post detail page.

## Consequences

- Users can categorize and filter book recommendations consistently with other media types.
- Multi-line descriptions render with the line breaks authors intended, improving readability.
- No migration is needed, keeping the change purely additive and safe to deploy.

## References

- `src/shared/infrastructure/db/schema.ts`
- `src/modules/posts/adapters/posts.functions.ts`
- `src/modules/posts/ui/CreatePostForm.tsx`
- `src/modules/posts/ui/PostCard.tsx`
- `src/routes/groups/$groupId/index.tsx`
- `src/routes/groups/$groupId/interactions.tsx`
- `README.md`
