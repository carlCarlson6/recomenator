# ADR 001: Initial Architecture and Implementation Plan for Recomenator

## Status

**Accepted / Implemented**

## Context

Recomenator is a private group app for friends to share recommendations about video games, movies, shows, music, and miscellaneous content. The first version needs to support:

- Social login.
- Private groups with invitation links.
- Recommendation posts under fixed categories.
- A timeline with category filtering.
- Flat replies on posts.
- In-app unread-reply indicators.

The project must be built with TanStack Start, Drizzle ORM, PostgreSQL (Neon), Clerk, and Vercel, while following domain-driven design, hexagonal architecture, and vertical slicing.

## Decisions

### 1. Framework and runtime

- **TanStack Start** with the modern `src/` layout for file-based routing, server functions, and SSR.
- **Vite** as the build tool with the `@tailwindcss/vite` plugin and the Nitro Vercel preset (`preset: 'vercel'`).
- **React 19** and **TypeScript 5**.

### 2. Authentication

- **Clerk** via `@clerk/tanstack-react-start` for social login.
- `clerkMiddleware()` registered in `src/start.ts` so `auth()` works inside server functions.
- Catch-all routes `/sign-in/$` and `/sign-up/$` render Clerk components.
- User data is mirrored into our `users` table on first server request.

### 3. Client state

- **TanStack Query** for caching, mutations, and targeted invalidation.
- Query keys follow a hierarchical pattern (`['groups']`, `['groups', groupId]`, `['groups', groupId, 'timeline', { category }]`, etc.).

### 4. Validation and environment

- **Zod** for server function inputs and form validation.
- **T3 Env** (`@t3-oss/env-core`) validates all environment variables at build and runtime.
- Server and client env schemas are split (`src/env/server.ts`, `src/env/client.ts`) to avoid leaking server variable names unnecessarily.

### 5. Database

- **PostgreSQL** with **Drizzle ORM**.
- Local development uses Docker Postgres via `scripts/start-local-db.sh`.
- Production/preview uses **Neon**:
  - Pooled `DATABASE_URL` for application queries.
  - Direct `DATABASE_URL_UNPOOLED` for migrations.
- App-generated prefixed text IDs (`usr_`, `grp_`, `inv_`, `mem_`, `pst_`, `rpl_`) using `nanoid`.
- No Postgres enums; categories and roles are stored as `text` with TypeScript value types.
- Surrogate primary keys plus `uniqueIndex` for business uniqueness (e.g., `memberships.userId + groupId`).
- All queries use the Drizzle `select()` builder; the relational API is not used.

### 6. Architecture style

- **Domain-Driven Design**: aggregates (`Group`, `Invite`, `Membership`, `Post`, `Reply`), value objects (`LinkPreview`), and domain errors.
- **Hexagonal Architecture**: repository interfaces live in domain/application layers; Drizzle repositories and Clerk adapters implement them.
- **Vertical Slicing**: each feature lives in `src/modules/<slice>` with its own domain, application, infrastructure, adapters, and UI.
- **Composition root**: `src/composition.ts` wires repositories into use cases.

### 7. Server functions

- `createServerFn` is the primary inbound adapter.
- All mutations are `POST`, all reads are `GET`.
- A reusable `protectedMiddleware` injects `userId` into the server-function context and redirects unauthenticated users.
- Use cases return `Result<T, DomainError>` and server functions unwrap results into HTTP-friendly errors.

### 8. Link previews

- A `LinkPreviewService` port with an `OpenGraphLinkPreviewService` adapter.
- YouTube URLs become iframe embeds.
- Spotify URLs use the oEmbed endpoint.
- Generic URLs fetch Open Graph tags with `cheerio`.
- Previews are fetched on post creation and stored denormalized on the `posts` row.

### 9. Notifications

- Unread replies are computed by comparing `memberships.lastReadAt` with reply `createdAt`.
- `markGroupAsRead` updates `lastReadAt` when a user opens a group timeline.
- Home page displays a badge count per group.

### 10. Testing

- **Vitest** with tests in `/test` mirroring `src/`.
- TDD-first for domain entities and use cases.
- Initial tests cover `idGenerator`, `Group`, `Invite`, and `Post` invariants.

### 11. Styling

- **Tailwind CSS v4** with CSS-first design tokens in `src/styles.css`.
- Mobile-first, minimal custom components, no external component library for v1.

### 12. Deployment

- **Vercel** hosts the TanStack Start app.
- **Neon** hosts Postgres with separate pooled and direct connection strings.
- Migrations are run against the target database before or after deploy, not during the build step.

## Consequences

- The codebase is modular and testable; swapping Clerk, the database driver, or the link-preview provider requires changing only adapter files.
- Server functions are type-safe and validated, but the project depends on TanStack Start’s still-maturing server-function API.
- The `cheerio` dependency increases the server bundle size; this is acceptable for v1 but may be split later.
- Local development requires Docker Postgres or a remote Postgres instance.

## References

- `README.md`
- `src/composition.ts`
- `src/modules/*/`
- `src/shared/infrastructure/db/schema.ts`
- `drizzle/0000_sparkling_the_anarchist.sql`
