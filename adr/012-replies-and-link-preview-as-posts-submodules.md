# ADR 012: Replies and Link Preview as Posts Submodules

## Status

**Accepted / Implemented**

## Context

The `src/modules/` folder listed six top-level vertical slices: `auth`, `groups`, `posts`, `replies`, `linkPreview`, and `notifications`. Two of those slices are not independent bounded contexts:

- `replies` only exists in the context of a post: its repository is injected into post use cases (`listTimelinePosts`, `getPost`, `listMyInteractions`) for reply counts, and its UI renders exclusively on the post detail page.
- `linkPreview` is only consumed by the `createPost` use case and its `LinkPreview` type is part of the `Post` aggregate.

Keeping them as peer slices overstated the module count and obscured the real dependency: both are part of the posts bounded context.

## Problem

- The top-level slice list implied six independent domains when there are really four.
- Cross-module imports (`posts` → `replies`, `posts` → `linkPreview`) were actually intra-domain imports dressed up as inter-module ones.

## Decision

Move `linkPreview` and `replies` inside the `posts` module as submodules:

```
src/modules/posts/
  ...            # existing posts files (unchanged location)
  linkPreview/   # moved from src/modules/linkPreview
  replies/       # moved from src/modules/replies
```

Key choices:

1. **Preserve internal structure.** Each submodule keeps its `domain/`, `application/`, `infrastructure/`, `adapters/`, `ui/` layout, so all internal relative imports stayed valid. Files were moved with `git mv` to preserve history.
2. **Follow the slice import convention after the move.** The project convention is relative imports within a slice and `#/` alias imports across slices. Since posts core and the two submodules are now one slice:
   - Posts core now imports the submodules relatively (e.g. `../replies/domain/ports/ReplyRepository.js`).
   - `replies/application/ReplyUseCases.ts` now imports posts core relatively (`../../domain/ports/PostRepository.js`) instead of via `#/modules/posts/...`.
   - Cross-slice imports (`#/modules/groups/...`, `#/modules/auth/...`, `#/shared/...`) and external entry points (`src/composition.ts`, route files) keep their existing style with updated paths.
3. **Mirror the move in tests.** `test/modules/replies/` moved to `test/modules/posts/replies/` per the "tests mirror src" convention.
4. **No logic changes.** Pure file relocation plus import path updates. No schema, API, or behavior changes.

## Changes

- Moved 13 source files (`git mv`): 4 under `src/modules/posts/linkPreview/`, 9 under `src/modules/posts/replies/`.
- Moved 2 test files to `test/modules/posts/replies/`.
- Updated imports in `src/composition.ts`, `src/routes/groups/$groupId/posts.$postId.tsx`, `Post.ts`, `CreatePost.ts`, `GetPost.ts`, `ListMyInteractions.ts`, `replies/application/ReplyUseCases.ts`, and 3 test files.
- Updated the README architecture section to list slices as `auth`, `groups`, `posts`, `notifications` with `replies` and `linkPreview` documented as posts submodules.

## Consequences

- The module list now reflects the real domain boundaries: posts owns its replies and link previews.
- Posts-core dependencies on replies/linkPreview no longer look like cross-module coupling.
- Nothing else consumes these submodules, so no other slice was affected.
- Verified with `npm run typecheck`, `npx vitest run` (13 files, 75 tests passing), and `npm run build`.
- Historical ADRs (005, 006, 011) still reference the old paths; they are kept as-is as point-in-time records.

## References

- `src/modules/posts/linkPreview/`
- `src/modules/posts/replies/`
- `src/modules/posts/domain/Post.ts`
- `src/modules/posts/application/CreatePost.ts`
- `src/modules/posts/application/GetPost.ts`
- `src/modules/posts/application/ListMyInteractions.ts`
- `src/composition.ts`
- `src/routes/groups/$groupId/posts.$postId.tsx`
- `test/modules/posts/replies/`
- `README.md`
