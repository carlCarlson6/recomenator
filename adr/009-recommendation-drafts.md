# ADR 009: Recommendation Drafts

## Status

**Accepted / Implemented**

## Context

Users wanted the ability to start a recommendation, save it, and come back later to finish editing before posting. The create-post view previously only allowed an immediate publish-or-nothing flow, which made it hard to compose longer recommendations or gather links over time.

## Decisions

### 1. Per-user, per-group drafts

- Drafts belong to a single user and a single group.
- A user can have many drafts in the same group.
- The draft list is shown only on the create-post page (`/groups/$groupId/posts/new`), so it is naturally scoped to the current group.
- Drafts are private to their author.

### 2. Partial drafts

- Drafts can be saved without a title or any optional fields.
- `title`, `description`, and `externalUrl` are stored as `NULL` when empty or whitespace-only.
- Field length limits and rating range (1–10) are still enforced, but no other publication-level validation is applied.
- Category defaults to `MISC` in the UI but is required in storage.

### 3. No link previews for drafts

- Open Graph / embed previews are fetched only when the user clicks **Post recommendation**.
- This keeps draft saves fast and avoids external calls for incomplete work.

### 4. Edit flow

- Clicking a draft in the list fills the form and puts the UI into "editing draft" mode.
- **Save as draft** updates the existing draft while preserving its identity.
- **Post recommendation** publishes the recommendation and deletes the draft being edited.
- A **New draft** button clears the form and exits editing mode.
- Each draft has a **Delete** button for manual cleanup.

### 5. Data model

- A new `drafts` table mirrors the post fields needed for composition:
  - `id`, `group_id`, `author_id`, `category`, `title`, `description`, `external_url`, `rating`, `created_at`, `updated_at`.
- Foreign keys cascade on group/user deletion.
- Index `drafts_group_id_author_id_updated_at_idx` supports efficient per-group draft listing sorted by recency.
- Check constraint ensures `rating` is either `NULL` or between 1 and 10.

### 6. Architecture

- New domain aggregate `Draft` in `src/modules/posts/domain/Draft.ts` with `create`, `update`, and `reconstitute` methods.
- New repository port `DraftRepository` and Drizzle implementation `DrizzleDraftRepository`.
- New use cases `saveDraft`, `listDrafts`, and `deleteDraft` in `src/modules/posts/application/DraftUseCases.ts`.
- `CreatePost` extended with an optional `draftId`; after a successful post save it deletes the associated draft.
- New server functions `saveDraftFn`, `listDraftsFn`, and `deleteDraftFn` exposed through `posts.functions.ts`.
- `CreatePostForm` extended with draft selection, save-as-draft, and delete interactions.

### 7. Query invalidation

- Saving, deleting, or posting a draft invalidates the `['groups', groupId, 'drafts']` query family so the draft list stays current.
- Posting also invalidates the timeline query family.

## Consequences

- Users can compose recommendations incrementally without losing work.
- The create-post page now has more UI elements, but the draft list is clearly separated below the form.
- Draft deletion is not transactional with post creation; a successful post followed by a failed draft delete leaves an orphan draft that can be removed manually.
- The `Draft` aggregate reuses the same validation style as `Post` but allows nullable title/description/link for flexibility.

## References

- `src/modules/posts/domain/Draft.ts`
- `src/modules/posts/domain/ports/DraftRepository.ts`
- `src/modules/posts/infrastructure/DrizzleDraftRepository.ts`
- `src/modules/posts/application/DraftUseCases.ts`
- `src/modules/posts/application/CreatePost.ts`
- `src/modules/posts/adapters/posts.functions.ts`
- `src/modules/posts/ui/CreatePostForm.tsx`
- `src/shared/infrastructure/db/schema.ts`
- `src/composition.ts`
- `test/modules/posts/domain/Draft.test.ts`
- `test/modules/posts/application/DraftUseCases.test.ts`
- `drizzle/0003_needy_the_initiative.sql`
