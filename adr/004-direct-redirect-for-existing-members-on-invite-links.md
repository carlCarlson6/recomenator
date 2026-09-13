# ADR 004: Direct Redirect to Group for Existing Members on Invite Links

## Status

**Accepted / Implemented**

## Context

ADR 003 established the group join flow. In that flow, when an authenticated user who was already a member opened an invitation link (`/groups/join/$inviteCode`), the route showed a friendly "You're already a member" page with a button linking to the group timeline.

While that page avoided an error state, it still forced members through an extra tap and screen render before reaching the group. The product requirement changed: logged-in users who are already members should reach the group view immediately, with no intermediate UI.

## Decisions

### 1. Redirect in `beforeLoad`

- The `/groups/join/$inviteCode` route already fetches the invite preview and the current user's membership in `beforeLoad`.
- If `getMyMembershipForGroupFn` returns a membership, `beforeLoad` now throws a hard `redirect` to `/groups/$groupId` for that group.
- The redirect happens before the join page component renders, so existing members never see the join form or the old confirmation page.

### 2. Remove the already-member UI branch

- The `JoinGroupPage` component previously rendered a dedicated branch when `membership` was present.
- That branch, along with the `membership` value from route context, has been removed.
- The component now only handles the non-member join flow.

### 3. Preserve non-member and unauthenticated behavior

- Unauthenticated users opening an invite link are still redirected to `/sign-in/$` with `redirect_url` preserved, exactly as described in ADR 003.
- Authenticated non-members still see the group preview and the display-name form.
- After successfully joining, the mutation still navigates to `/groups/$groupId`.

### 4. Testing

- `npm run typecheck` passes.
- Existing application and domain tests continue to pass.
- No new domain tests were needed because this is a routing/UX change.

## Consequences

- Existing members get a faster, frictionless experience when opening an invite link.
- The join route no longer has an already-member UI state to maintain.
- `beforeLoad` still performs the membership lookup, so the redirect remains secure and cannot be bypassed by client-side rendering.

## References

- `src/routes/groups/join.$inviteCode.tsx`
- `src/modules/groups/adapters/groups.functions.ts`
- `adr/003-group-join-flow-with-auth-redirect-preservation.md`
