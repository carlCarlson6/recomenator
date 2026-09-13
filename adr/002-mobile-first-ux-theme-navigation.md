# ADR 002: Mobile-First Group UX, Theme Toggle, and Navigation Improvements

## Status

**Accepted / Implemented**

## Context

The first POC of Recomenator worked, but the group view was not optimized for mobile daily use: the recommendation form and invite generator sat at the top of the page, the home page always forced an extra tap when the user belonged to only one group, there was no way to switch between light and dark modes, and several pages lacked obvious navigation back to their logical parent.

We needed a focused polish pass that keeps the existing architecture and domain model intact while improving the mobile experience.

## Decisions

### 1. Single-group redirect from home

- The `/` route now runs a server-side `loader` that checks the authenticated user and fetches their groups.
- If the user belongs to exactly one group, the loader throws a hard `redirect` to `/groups/$groupId`.
- If the user has zero or multiple groups, the loader returns the list and the normal home page renders.
- Signed-out users still see the landing page; no protected middleware is invoked on `/`.

### 2. Recommendation creation becomes a full-screen route

- A new file route `src/routes/groups/$groupId/posts.new.tsx` handles `/groups/$groupId/posts/new`.
- The inline `<CreatePostForm>` was removed from the group timeline page.
- `CreatePostForm` now accepts an optional `onSuccess` callback so the standalone route can navigate back to the group after a successful post.
- This is more efficient on mobile than a modal because it gives the keyboard and form the full viewport.

### 3. Fixed bottom action bar on the group view

- The group page now renders a fixed bottom bar with three icon+text actions:
  - **Home** (`Home` icon) → `/`
  - **Recommend** (`Plus` icon) → `/groups/$groupId/posts/new`
  - **Settings** (`Settings` icon) → `/groups/$groupId/settings`
- The bar is a reusable `BottomBar` component in `src/shared/ui/BottomBar.tsx` and respects the mobile safe area.
- The previous "Settings" text link and the "Generate invite link" button were removed from the group page header.

### 4. Invite link generation moves to Settings

- The invite generation and copy flow was relocated to `src/routes/groups/$groupId/settings.tsx`.
- Permissions remain unchanged: any group member can generate an invite link.
- Settings also keeps the existing display-name editor.

### 5. Theme support

- Tailwind CSS v4 CSS-first tokens were extended with dark variants in `src/styles.css`.
- A custom `@custom-variant dark` selector watches `data-theme="dark"`.
- Colors are overridden inside `[data-theme="dark"]` for background, foreground, primary, muted, border, and card surfaces.
- `src/shared/ui/ThemeProvider.tsx` exposes `theme`, `resolvedTheme`, and `setTheme` and persists the user's choice (`light`, `dark`, or `system`) in `localStorage`.
- A small blocking script in `src/routes/__root.tsx` reads `localStorage` and applies the resolved theme before React hydrates to prevent a flash.
- `src/shared/ui/ThemeSelect.tsx` is used in settings to let users choose between Light, Dark, and System.

### 6. Consistent page navigation

- Every non-root page now has a clear way back to its logical parent and to the group list:
  - **Group page:** bottom bar contains Home and My-groups escape routes.
  - **Settings page:** top bar has "Back to group" and "My groups".
  - **New recommendation page:** top bar has "Back to group" and "My groups".
  - **Post detail page:** top bar has "Back to group" and "My groups".
  - **Create group page:** top bar has "Back" to `/`.
  - **Join group page:** top bar has "Back" to `/`.
- Navigation uses `lucide-react` icons plus text labels.

### 7. Dependency choice

- `lucide-react` was added for consistent, lightweight, tree-shakeable icons.
- The rest of the iconography remains text-only where no icon adds clarity.

### 8. Testing

- Existing domain tests (`idGenerator`, `Group`, `Invite`, `Post`) were not affected and still pass.
- `npm run typecheck` passes.
- No new domain tests were added because these changes are UI-level and routing-level; future work may add component or E2E tests once the UI stabilizes.

## Consequences

- Mobile users can move between home, recommendations, and settings with one thumb.
- Single-group users skip the otherwise redundant home page.
- Dark mode works across the app and respects system preferences by default.
- The codebase introduces a small shared UI layer (`src/shared/ui/`) for theme and navigation primitives, which is expected to grow as the design system matures.
- `lucide-react` is now a runtime dependency.

## References

- `src/routes/index.tsx`
- `src/routes/groups/$groupId/index.tsx`
- `src/routes/groups/$groupId/settings.tsx`
- `src/routes/groups/$groupId/posts.new.tsx`
- `src/routes/groups/$groupId/posts.$postId.tsx`
- `src/routes/groups/new.tsx`
- `src/routes/groups/join.$inviteCode.tsx`
- `src/routes/__root.tsx`
- `src/modules/posts/ui/CreatePostForm.tsx`
- `src/shared/ui/BottomBar.tsx`
- `src/shared/ui/ThemeProvider.tsx`
- `src/shared/ui/ThemeSelect.tsx`
- `src/styles.css`
- `src/routeTree.gen.ts`
