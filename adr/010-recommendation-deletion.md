# ADR 010: Recommendation Deletion

## Status

**Accepted / Implemented**

## Context

Users wanted the ability to remove recommendations they had posted. This is a destructive action that should be limited to the original author and should clearly communicate the consequences before proceeding. The existing schema already models posts with cascading replies and reactions, so hard deletion is straightforward at the data layer.

## Decisions

### 1. Author-only deletion

- Only the post author can delete a recommendation.
- The `deletePost` use case loads the post, returns `PostNotFoundError` if it does not exist, and returns `UnauthorizedError` if the requesting user is not the author.
- Group owners and admins are not granted moderation deletion rights in this change.

### 2. Hard delete

- Deleting a post permanently removes the row from the `posts` table.
- Replies and reactions are removed automatically via existing `onDelete: 'cascade'` foreign keys on `replies.postId` and `postReactions.postId`.
- No `deletedAt` column or soft-delete filtering is introduced.

### 3. Domain and application layer

- Added `delete(id: string): Promise<void>` to the `PostRepository` port.
- Created `src/modules/posts/application/DeletePost.ts` with the author-check logic.
- Implemented `delete` in `DrizzlePostRepository` with a single `db.delete(posts).where(...)` call.
- Wired `deletePost` into `src/composition.ts`.
- Exposed `deletePostFn` as a POST server function protected by `protectedMiddleware`.

### 4. UI/UX

- Added a delete action to `PostCard`, visible only when the current user's ID matches `post.authorId`.
- The delete action is rendered as a standalone trash icon (`Trash2`) with no text label.
- Clicking the icon opens a modal confirmation dialog instead of a browser `confirm` prompt.
- The modal explains that the action cannot be undone and provides **Cancel** and **Delete** buttons.
- After a successful deletion:
  - Timeline, interactions, post detail, and unread queries are invalidated.
  - When deleted from the post detail page, the user is redirected back to the group timeline.

### 5. Tests

- Added `test/modules/posts/application/DeletePost.test.ts` covering:
  - Successful deletion by the author.
  - Rejection when the post does not exist.
  - Rejection when another user attempts to delete the post.
- Updated `test/modules/posts/application/ListMyInteractions.test.ts` to satisfy the extended `PostRepository` interface.

## Consequences

- Authors can clean up their own recommendations.
- Destructive deletion is gated behind a clear confirmation modal, reducing accidental removals.
- Replies and reactions are removed along with the post, which is consistent with hard deletion and matches user expectations.
- No database migration is required because the existing cascade constraints already handle related data.

## References

- `src/modules/posts/domain/ports/PostRepository.ts`
- `src/modules/posts/application/DeletePost.ts`
- `src/modules/posts/infrastructure/DrizzlePostRepository.ts`
- `src/modules/posts/adapters/posts.functions.ts`
- `src/modules/posts/ui/PostCard.tsx`
- `src/shared/ui/Modal.tsx`
- `src/routes/groups/$groupId/index.tsx`
- `src/routes/groups/$groupId/posts.$postId.tsx`
- `src/composition.ts`
- `test/modules/posts/application/DeletePost.test.ts`
