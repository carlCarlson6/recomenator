# ADR 016: TanStack Start XSS Security Update

## Status

**Accepted / Implemented**

## Context

Vercel blocked deployment with the error:

> Vulnerable TanStack Start package detected (`@tanstack/react-start@1.168.53`). Please update to a patched version.

TanStack disclosed **CVE-2026-102989**, a critical reflected XSS vulnerability in TanStack Start server-function response handling. The first patched version for `@tanstack/react-start` is `1.168.60`, and the underlying `@tanstack/start-server-core` must be `1.169.39` or later.

## Decisions

### 1. Upgrade affected TanStack packages

Updated `package.json` to patched/compatible versions:

| Package | From | To |
|---|---|---|
| `@tanstack/react-start` | `^1.168.52` | `^1.168.60` |
| `@tanstack/react-router` | `^1.170.35` | `^1.170.41` |
| `@tanstack/router-cli` | `^1.167.35` | `^1.167.40` |

`@tanstack/react-start@1.168.60` pins `@tanstack/start-server-core@1.169.39`, satisfying the patched server-core requirement.

### 2. Regenerate the lockfile

Ran `npm install` so `package-lock.json` resolves the patched versions and drops the vulnerable `1.168.53` tree.

### 3. Remove leftover dead code surfaced by type checking

After the upgrade, `npm run typecheck` failed on `src/modules/auth/infrastructure/TanstackClerkUserProvider.ts`, which imported a `ClerkUserProvider` port that no longer exists (it was removed during the CQRS refactor in ADR 015). The file was unused, so it was deleted.

## Consequences

- The vulnerable TanStack Start version is no longer in the dependency tree.
- Vercel deployment should proceed without the XSS guardrail error.
- `npm run typecheck`, `npm test`, and `npm run build` all pass.

## QA checklist

- [x] `npm ls @tanstack/react-start` reports `1.168.60`.
- [x] `npm ls @tanstack/start-server-core` reports `1.169.39`.
- [x] `npm run typecheck` passes.
- [x] `npm test -- --run` passes (80 tests).
- [x] `npm run build` succeeds for the Vercel preset.

## References

- [TanStack Start security update: CVE-2026-102989](https://tanstack.com/blog/tanstack-start-security-update-cve-2026-102989)
- [ADR 015: CQRS Refactor](./015-cqrs-queries-and-commands.md)
