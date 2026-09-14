# Recomenator

A private group app for friends to share recommendations about video games, movies, shows, music, books, and miscellaneous content.

## What it does

- Users sign in with social login via Clerk.
- Users create private groups and generate long-expiring, multi-use invitation links.
- Other users join groups only via an invitation link.
- Members post recommendations under a fixed category with an optional description and external link.
- The app fetches link previews (Open Graph, YouTube, Spotify embeds) when a post is created.
- Members see a reverse-chronological timeline of group recommendations and filter by category.
- Members reply to posts to start discussions.
- An in-app indicator shows groups with unread replies.

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

The app follows **Domain-Driven Design**, **Hexagonal Architecture**, and **Vertical Slicing**.

```
src/
  routes/              # TanStack Start file routes (inbound adapters)
  modules/             # Vertical slices: auth, groups, posts, replies, linkPreview, notifications
    <slice>/
      domain/          # Aggregates, value objects, repository ports
      application/     # Use cases
      infrastructure/  # Drizzle repositories, external adapters
      adapters/        # Server functions (.functions.ts) + shared schemas (.schemas.ts)
      ui/              # Components for this slice
  shared/              # Kernel (Result, errors, ID generator) + DB client/schema
  env/                 # T3 Env server + client schemas
```

Dependencies point inward: routes/adapters → application → domain. Infrastructure implements domain/application ports. The `src/composition.ts` file wires adapters to use cases.

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
- Use `db.select()` builder for all Drizzle queries; never use the relational API.
- App-generated prefixed text IDs; no `serial` columns and no Postgres enums.
- Use `Result<T, DomainError>` for domain operations.
- Write failing tests before implementation (TDD).
- Tests live in `/test` at the repo root, mirroring `src/`.

## Deployment

1. Create a Neon project and database.
2. Set `DATABASE_URL` to the **pooled** connection string (hostname ends in `-pooler`).
3. Set `DATABASE_URL_UNPOOLED` to the **direct** connection string.
4. Create a Vercel project, connect the repo, and set all environment variables.
5. Run `npm run db:migrate` against the target database.
6. Deploy with `npm run build`.

## License

MIT
