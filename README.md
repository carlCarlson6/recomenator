# Recomenator

A private group app for friends to share recommendations about video games, movies, shows, music, books, and miscellaneous content.

## What it does

- Users sign in with social login via Clerk.
- Users create private groups and generate long-expiring, multi-use invitation links.
- Other users join groups only via an invitation link.
- Members post recommendations under a fixed category with an optional description and external link. Authors can edit their own recommendations, and link previews refresh when the link changes.
- The app fetches link previews (Open Graph, YouTube, Spotify embeds) when a post is created.
- Members see a reverse-chronological timeline of group recommendations and filter by category.
- Members reply to posts to start discussions, with Reddit-style nested reply threads (reply to any reply, collapsible threads, soft-deleted replies keep their children).
- Each group has a notification center that records interactions (reactions or replies) on a member's own recommendations, with an unseen counter that clears when the notifications page is opened.

## Tech stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (`src/` layout)
- **Authentication:** [Clerk](https://clerk.com) with `@clerk/tanstack-react-start`
- **Client state:** [TanStack Query](https://tanstack.com/query)
- **Validation:** [Zod](https://zod.dev)
- **Environment validation:** [T3 Env](https://env.t3.gg)
- **ORM:** [Drizzle ORM](https://orm.drizzle.team)
- **Database:** PostgreSQL (local Docker for development, [Neon](https://neon.tech) for production/preview)
- **DB driver:** `pg`
- **Hosting:** [Vercel](https://vercel.com)
- **Styling:** Tailwind CSS v4 with CSS-first design tokens
- **Testing:** Vitest
- **IDs:** `nanoid` with prefixes (`usr_`, `grp_`, `pst_`, etc.)

## Architecture

The app uses **CQRS (Command Query Responsibility Segregation)**. Reads and writes are
separate code paths, backed by the same Postgres database.

```
src/
  routes/                    # TanStack Start file routes
  components/                # Feature UI (PostCard, ReplyList, forms) consuming read models
  modules/
    queries/                 # READ side: thin Drizzle queries -> read models
      shared/                # userIdentity resolver, PostCardRM assembly (reused by views)
      <readModel>/           # one folder per read model (timeline, postDetail, home, ...)
        <name>Query.ts        # db.select() -> plain DTO
        <name>.functions.ts   # createServerFn wrappers
    commands/                # WRITE side: DDD aggregates + use cases
      <feature>/              # auth, groups, posts, notifications
        domain/               # Aggregates, value objects, repository ports
        application/          # Use cases (return Result)
        infrastructure/       # Drizzle repositories, external adapters
        adapters/             # createServerFn wrappers
      posts/
        replies/              # Submodule: nested reply threads
        linkPreview/          # Submodule: external link preview fetching
  shared/                    # Kernel (Result, errors, ID generator) + DB client/schema
  env/                       # T3 Env server + client schemas
```

### Read side (`modules/queries`)

- One folder per **read model**, defined by what a view needs (`timeline`, `interactions`,
  `postDetail`, `home`, `reactors`, `notifications`, `invite`, `drafts`, `groupHeader`).
- Shared read shapes live in `queries/shared`. `PostCardRM` is shared by timeline,
  interactions, and post detail because those views reuse the same `PostCard` UI.
- Queries are **thin**: one `db.select()` (or a few parallel selects) that returns a plain DTO.
  No domain entities, no repositories, no `Result`, no writes.
- Queries may join freely across tables — that is the point.
- Display names are resolved by `queries/shared/userIdentity.ts` using the chain
  `membership.displayName -> Clerk username -> email -> 'Anonymous'`. The Clerk lookup is
  batched (`getUserList`) and never written back to the database.

### Write side (`modules/commands`)

- One use case per file under `<feature>/application` (`createPost`, `joinGroup`, `addReply`, ...).
- Commands keep the DDD building blocks: aggregates, value objects, repository ports, and
  `Result<T, DomainError>`.
- A command returns only what the caller needs to proceed (often just an `id`).
- Interactions (reactions, replies) append a notification event for the post author. Events are
  immutable: removing a reaction or deleting a post/reply does not remove them, and recording an
  event is best-effort so it never fails the interaction.
- Cross-module dependencies are wired explicitly in `src/composition.ts` (`createUseCases()`).

### Adding code

- **New read:** create `queries/<readModel>/` with a `*Query.ts` plus a `*.functions.ts`
  server function, then consume it from the route/component.
- **New write:** add a use case under `commands/<feature>/application/`, add any repository
  method to the port + Drizzle implementation, and wire it in `src/composition.ts`.

## Environment variables

Copy `.env.example` to `.env` and fill in the values.

| Variable | Scope | Description |
|---|---|---|
| `DATABASE_URL` | server | Pooled Postgres connection string (Neon `-pooler` or local Postgres) |
| `DATABASE_URL_UNPOOLED` | server | Direct Postgres connection string for migrations |
| `CLERK_SECRET_KEY` | server | Clerk secret key |
| `VITE_CLERK_PUBLISHABLE_KEY` | client | Clerk publishable key |
| `VITE_CLERK_SIGN_IN_URL` | client | `/sign-in` |
| `VITE_CLERK_SIGN_UP_URL` | client | `/sign-up` |
| `VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | client | `/` |
| `VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL` | client | `/` |

T3 Env validates all variables at build and runtime.

## Development

### Start the local database

```bash
npm run db:start
```

### Install dependencies

```bash
npm install
```

### Run migrations

```bash
npm run db:migrate
```

### Seed the database

```bash
npm run db:seed
```

### Run the dev server

```bash
npm run dev
```

### Run tests

```bash
npm test
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start TanStack Start dev server |
| `npm run build` | Build for production |
| `npm run db:start` | Start local Postgres in Docker |
| `npm run db:stop` | Stop local Postgres |
| `npm run db:generate` | Generate Drizzle migration |
| `npm run db:migrate` | Run Drizzle migrations |
| `npm run db:seed` | Seed local database |
| `npm run db:reset` | Stop, start, migrate, and seed local database |
| `npm test` | Run Vitest |

## Conventions

- **Mobile-first** responsive design.
- **No barrel files**; import directly from source files.
- Use the `db.select()` builder for all Drizzle queries; never use the relational API.
- App-generated prefixed text IDs; no `serial` columns and no Postgres enums.
- **CQRS:** reads live in `modules/queries` (plain DTOs, no writes); writes live in
  `modules/commands` (use cases returning `Result<T, DomainError>`).
- `Result<T, DomainError>` is for commands. Queries return DTOs directly and throw on
  missing/unauthorized resources.
- Write failing tests before implementation (TDD).
- Tests live in `/test` at the repo root, mirroring `src/` (`test/modules/queries/...`,
  `test/modules/commands/...`).

## Deployment

1. Create a Neon project and database.
2. Set `DATABASE_URL` to the **pooled** connection string (hostname ends in `-pooler`).
3. Set `DATABASE_URL_UNPOOLED` to the **direct** connection string.
4. Create a Vercel project, connect the repo, and set all environment variables.
5. Run `npm run db:migrate` against the target database.
6. Deploy with `npm run build`.

## License

MIT
