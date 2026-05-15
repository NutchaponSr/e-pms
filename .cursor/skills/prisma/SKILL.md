---
name: prisma
description: >-
  Guides Prisma schema design, migrations, Prisma Client usage, and database
  workflows for this repository (Prisma 7, PostgreSQL via driver adapter). Use
  when editing prisma/schema.prisma, migrations, seed scripts, database types,
  or when the user mentions Prisma, Prisma Client, migrate, db push, or
  introspection.
disable-model-invocation: true
---

# Prisma (e-pms)

## Repository context

- Schema: `prisma/schema.prisma`
- Client: `@prisma/client` (v7); PostgreSQL with `@prisma/adapter-pg` + `pg` in app code when applicable
- Useful scripts in `package.json`: `db:studio`, `db:seed`, `db:export`; `postinstall` runs `prisma generate`

Read the current schema and any existing migration SQL before proposing model or relation changes.

## Workflow checklist

1. **Schema change** — Edit `schema.prisma`; keep naming consistent with existing models and enums.
2. **Create migration (dev/staging with history)** — Prefer `npx prisma migrate dev --name <short_description>` so a SQL migration is recorded. Avoid destructive renames without a data plan.
3. **Prototype only** — `npx prisma db push` is acceptable for local throwaway DBs; do not rely on it for shared environments when migration history matters.
4. **Regenerate client** — After schema or generator changes: `npx prisma generate` (also runs on `npm install` via `postinstall`).
5. **Validate** — Run the project’s checks (e.g. `npm run lint`, TypeScript) after client-facing type changes.

## Conventions

- Prefer explicit `@relation` fields and `onDelete` / `onUpdate` that match product rules (cascade vs restrict).
- Use `@map` / `@@map` when DB column/table names differ from Prisma field names; keep API names stable for application code.
- Add indexes (`@@index`) for foreign keys and common filter/sort columns when queries justify them.
- For new optional columns on large tables in production, consider multi-step deploys (add nullable → backfill → enforce) rather than a single breaking migration when relevant.

## Application code

- Use the project’s established Prisma client singleton / import path; do not instantiate many short-lived `PrismaClient` instances in hot paths.
- Prefer typed `select` / `include` / `omit` to limit payloads; use transactions (`$transaction`) for multi-step consistency.
- Never log full connection strings or secrets; `.env` stays out of commits.

## When unsure

- Inspect generated migration SQL under `prisma/migrations/` for safety (drops, truncates, type coercion).
- For Prisma 7–specific APIs (client extensions, adapters), follow patterns already present in the repo before introducing new ones.

## Optional detail

For longer reference (relation diagrams, extended checklists), add `reference.md` alongside this file and link it here when it exists.
