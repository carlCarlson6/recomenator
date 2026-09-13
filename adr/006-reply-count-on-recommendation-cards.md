# ADR 006: Reply Count on Recommendation Cards

## Status

**Accepted / Implemented**

## Context

Recommendation cards already show reactions, the author name, and a "View replies" link, but they gave no hint about whether a post had started a discussion. Users wanted to see at a glance which recommendations had replies and how many, while keeping the card clean when a post had no replies yet.

## Decisions

### 1. Reply count in the post read model

- `replyCount` is added to `PostDto` as a non-nullable integer.
- The count is resolved at read time by the existing `listTimelinePosts` and `getPost` use cases.
- A new `countByPostIds` query on `ReplyRepository` returns aggregate reply counts for a batch of post IDs in a single grouped SQL query.
- `countByPostIds` returns an empty array when given an empty list of post IDs to avoid executing an unnecessary query.

### 2. Composition

- `replyRepo` is already instantiated in `src/composition.ts`; it is now passed into `listTimelinePosts` and `getPost` alongside the post and reaction repositories.
- `createPost` sets `replyCount` to `0` because a newly created post cannot have replies yet.

### 3. UI behavior

- The "View replies" link on `PostCard` is accompanied by a speech-bubble icon (`MessageCircle`).
- When `replyCount` is greater than zero, a small badge shows the count next to the label.
- When `replyCount` is zero, no badge is shown and the link remains unchanged visually.

## Consequences

- Users can immediately identify posts with active discussions from the group timeline.
- Cards without replies stay visually uncluttered.
- The timeline read path now includes one additional aggregate query, but it is batched per request so the cost is small for the expected group sizes.
- The `ReplyRepository` port gained a read-only counting method, keeping reply storage details behind the repository boundary.

## References

- `src/modules/replies/domain/ports/ReplyRepository.ts`
- `src/modules/replies/infrastructure/DrizzleReplyRepository.ts`
- `src/modules/posts/application/CreatePost.ts`
- `src/modules/posts/application/GetPost.ts`
- `src/modules/posts/ui/PostCard.tsx`
- `src/composition.ts`
