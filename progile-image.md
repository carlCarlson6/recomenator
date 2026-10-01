Objective
- Add profile pictures to the "Recomenator" app: users upload a custom avatar stored in a dedicated public Neon object-storage bucket (S3-compatible); fall back to Clerk's image, then to local initials. Currently in plan mode — no code changes made yet.
Important Details
- Decisions from user's answers to the grilling:
- Credentials from the pasted snippet were rotated (no longer a concern).
- Storage: dedicated public bucket; store the full URL in DB (not the object key).
- Avatar scope: per-membership (like per-group displayName), so it lives in the groups module, not auth.
- Upload: presigned PUT direct-to-S3; client validates the file is an image; client transcodes (no GIF).
- Two-phase commit: upload → confirmation call verifies (e.g. HeadObject), applies necessary rollback on failure to avoid orphans/broken images.
- Limits: user said max 512MB (flagged as unsafe for avatars + public bucket + no rate limit — recommend lowering, e.g. ~5MB); allowed types jpeg/png/webp/avif; no rate limiting for now.
- No server-side resize; no multiple sizes.
- Fallback: extend the live Clerk lookup to also return imageUrl; use local initials when Clerk has no image.
- Apply to all read models (timeline/PostCard, replies, reactors, home, groupHeader, invite, postDetail).
- Use a port-adapter for storage (matches DDD/hexagonal conventions) + in-memory fake for Vitest (README mandates TDD).
- Forget cache-busting for now (propose unique per-upload key so URL changes anyway).
- New command/use case in the groups module, not auth.
- Env vars will be configured by the user later; go with recommendations for S3 client lifecycle (module-level singleton) + bucket CORS.
- Architecture facts (verified):
- CQRS; reads and writes are separate paths. Writes = use cases wired in src/composition.ts; reads = query DTOs.
- users.avatarUrl exists but is a dead column (per adr/015-cqrs-queries-and-commands.md); display names are resolved live from Clerk and never persisted.
- protectedMiddleware provides context.userId; auth() from @clerk/tanstack-react-start/server.
- IDs are nanoid with prefixes (usr_, grp_, pst_, mem_, inv_).
- T3 Env uses strict runtime env (src/env/server.ts currently only has DATABASE_URL, DATABASE_URL_UNPOOLED, CLERK_SECRET_KEY).
- Planned new env vars (add to src/env/server.ts): AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, plus an avatar bucket name.
- Neon S3 endpoint: https://br-weathered-dawn-a21yj4rr.storage.c-1.eu-central-1.aws.neon.tech, region eu-central-1, S3 examples use forcePathStyle: true, bucket assets (confirm real bucket name).
- Planned flow: createAvatarUploadUrlFn (authz via membership, generate key avatars/<membershipId>/<nanoid>.<ext>, return presigned PUT + public URL) → client uploads → confirmAvatarUploadFn (HeadObject verify existence/type/size/prefix, update memberships.avatarUrl, rollback on failure).
Work State
Completed
- Explored codebase: schema, User aggregate, SyncClerkUser, DrizzleUserRepository, auth.functions.ts, protectedMiddleware, composition.ts, userIdentity.ts, postCardQuery.ts, env files, routes, ADR list.
- Delivered grilling questions; user answered all 20.
- Confirmed DB plan: add avatar_url column to memberships (new migration); keep users.avatar_url dead.
Active
- Verifying all read-side call sites of resolveDisplayNames / ClerkNameLookup / authorDisplayName to correctly scope the "all read models" change (grep returned 100+ matches, truncated).
Blocked
- (none) — user will configure env values on Vercel later; 512MB limit raised as a recommendation, not blocking.
Next Move
1. Read the read-model/query files (reactors/reactorsQuery.ts, timeline/timelineQuery.ts, home/homeQuery.ts, groupHeader/groupHeaderQuery.ts, invite/inviteQuery.ts, postDetail/postDetailQuery.ts, replies components) to enumerate every place avatars must be added and all call sites of the identity resolver.
2. Produce the concrete implementation plan (new groups use case AvatarUseCases.ts with create-upload-url + confirm, storage port + S3 adapter + fake, membership schema/migration, extended userIdentity.ts to return avatar with Clerk imageUrl then initials fallback, UI updates, tests, ADR).
Relevant Files
- README.md: tech stack, CQRS layout, TDD mandate, ID prefixes.
- src/composition.ts: wires all write use cases; new groups use case must be registered here.
- src/shared/infrastructure/db/schema.ts: users (dead avatarUrl) + memberships (add avatar_url here).
- src/modules/queries/shared/userIdentity.ts: live Clerk name resolver to extend for imageUrl + initials fallback.
- src/modules/queries/shared/postCardQuery.ts: PostCardRM — add authorAvatarUrl.
- src/modules/queries/reactors/reactorsQuery.ts: uses resolveDisplayNames; add avatar.
- src/modules/commands/auth/domain/User.ts & infrastructure/DrizzleUserRepository.ts: reference for aggregate/repo patterns.
- src/modules/commands/groups/ (application/, domain/ports/MembershipRepository.ts, infrastructure/DrizzleMembershipRepository.ts): home for new avatar command + storage port.
- src/env/server.ts: add S3 env vars (T3 Env strict).
- src/shared/infrastructure/auth/protectedMiddleware.ts: auth context for server fns.
- src/components/PostCard.tsx, ReplyItem.tsx, ReactorsModal.tsx, ReplyList.tsx: UI render sites for avatars.
- adr/015-cqrs-queries-and-commands.md: explains dead avatar_url column + live resolution rationale.
- test/modules/queries/shared/userIdentity.test.ts: pattern for resolver tests; add storage fake under test/.
- scripts/seed.ts: seed memberships (may need avatars for dev).