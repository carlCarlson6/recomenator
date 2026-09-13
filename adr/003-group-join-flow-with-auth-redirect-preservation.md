# ADR 003: Group Join Flow with Auth Redirect Preservation

## Status

**Accepted / Implemented**

## Context

Joining a group in Recomenator happens only through an invitation link. The intended flow is:

1. A member generates an invite link for a group.
2. A recipient opens the link (`/groups/join/$inviteCode`).
3. If the recipient is not signed in, they are asked to sign in and then returned to the join page.
4. The recipient sees the group name, enters a display name, and clicks **Join group**.
5. After joining, they are redirected to the group timeline.

The original implementation had three gaps:

- The join route was public, but the actual `joinGroupFn` server function used `protectedMiddleware`. When an unauthenticated user submitted the form, the middleware redirected to `/sign-in/$` without remembering the original URL, so after authentication the user landed on `/` instead of back on the join page.
- The join page showed only the raw invite code, not the group name, so users could not confirm what they were joining.
- If an authenticated user who was already a member opened the link and submitted the form, the use case returned an `AlreadyMemberError`, which felt like a failure rather than a natural continuation.

## Decisions

### 1. Redirect preservation across authentication

- `protectedMiddleware` now extracts the `Referer` header and appends it as `redirect_url` when redirecting unauthenticated users to `/sign-in/$`.
- The `/sign-in/$` and `/sign-up/$` routes accept a `redirect_url` search parameter and pass it to Clerk through the `fallbackRedirectUrl` prop.
- The alternate auth link (`signUpUrl` on the sign-in page, `signInUrl` on the sign-up page) also forwards `redirect_url` so users can switch between sign-in and sign-up without losing their destination.

### 2. Join route guards and preview

- `/groups/join/$inviteCode` now has a `beforeLoad` guard that runs before rendering.
- If the user is not authenticated, `beforeLoad` throws a `redirect` to `/sign-in/$` with `redirect_url` set to the current join URL.
- If the user is authenticated, `beforeLoad` fetches:
  - A public invite preview (`getInvitePreviewFn`) containing the group name.
  - The user's existing membership for that group (`getMyMembershipForGroupFn`).
- The preview and membership are returned as route context so the component can render the appropriate UI without a second round-trip.

### 3. Already-member experience

- When the join route detects an existing membership, it shows a friendly message — "You're already a member" — with the group name and a button that links directly to the group timeline.
- The `JoinGroup` use case was also changed so that an already-member submission returns the existing membership instead of an error. This makes the flow resilient if the membership check is ever bypassed.

### 4. Public invite preview use case

- A new application use case, `GetInvitePreview`, looks up an invite by code, validates that it has not expired or exceeded its max uses, and returns the group ID and name.
- It is intentionally public: no authentication is required so the join page can show the group name even before the user decides to sign in (although the current UX immediately redirects unauthenticated users to sign-in).

### 5. Membership lookup use case

- A new application use case, `GetMyMembershipForGroup`, returns the authenticated user's membership for a given group, or `null` if they are not a member.
- It reuses the existing `MembershipRepository` port and returns a lightweight DTO.

### 6. Server function changes

- Added `getInvitePreviewFn` (`GET`, public) and `getMyMembershipForGroupFn` (`GET`, protected) to `src/modules/groups/adapters/groups.functions.ts`.
- Updated `joinGroupFn` semantics indirectly: it no longer fails on already-member thanks to the use-case change.

### 7. Composition root updates

- `src/composition.ts` now wires `getInvitePreview` and `getMyMembershipForGroup` alongside the existing group use cases.

### 8. Testing

- Added application-level tests for both new use cases and the updated `JoinGroup` behavior.
- Tests use small in-memory repository stubs to keep them fast and independent of the database.
- Existing domain tests continue to pass.

## Consequences

- Unauthenticated users who open an invite link are redirected to sign-in, then automatically returned to the join page after authentication.
- New users can sign up from the same flow and still land back on the join page.
- Authenticated users see the group name before deciding to join, which reduces confusion and accidental joins.
- Existing members get a clear confirmation and a direct link to the group instead of an error.
- `protectedMiddleware` now preserves the original URL for all protected server functions, not just the join flow.
- The join route performs two serial server calls in `beforeLoad` (auth check, invite preview, membership lookup). This is acceptable because the data is small and the calls are cacheable; if latency becomes an issue they can be collapsed into a single dedicated server function later.

## References

- `src/routes/groups/join.$inviteCode.tsx`
- `src/routes/sign-in.$.tsx`
- `src/routes/sign-up.$.tsx`
- `src/shared/infrastructure/auth/protectedMiddleware.ts`
- `src/modules/groups/application/GetInvitePreview.ts`
- `src/modules/groups/application/GetMyMembershipForGroup.ts`
- `src/modules/groups/application/JoinGroup.ts`
- `src/modules/groups/adapters/groups.functions.ts`
- `src/composition.ts`
- `test/modules/groups/application/GetInvitePreview.test.ts`
- `test/modules/groups/application/JoinGroup.test.ts`
