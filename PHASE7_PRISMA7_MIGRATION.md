# RHYTHM Phase 7 — Prisma security remediation

This revision migrates Prisma ORM **6.19.0 → 7.10.1**, matching the remediation suggested by the user's `npm audit` output. It also updates the runtime PostgreSQL adapter and moves the CLI connection settings to `prisma.config.ts`. The existing PostgreSQL tables and columns are **not** intentionally modified by this code patch.

## What changed

- `prisma` and `@prisma/client` pinned at 7.10.1; `@prisma/adapter-pg`, `pg`, `dotenv`, `tsx`, and PostgreSQL types added.
- `prisma/schema.prisma` uses Prisma 7's `prisma-client` generator with output to `src/generated/prisma`.
- `prisma.config.ts` holds the CLI datasource and seed config.
- All server imports reference the generated client; `src/lib/db.ts` now initializes `PrismaPg` using `DATABASE_URL` with a limited pool size.
- Seed script converted to `prisma/seed.ts` and uses the adapter too. Do **not** run it against a populated storefront without reviewing its edits.
- Previous Nodemailer and PostCSS fixes retained.

## Requirements

- Node.js **22.12+** (recommended) or 20.19+; npm available.
- Keep working `.env` in the project root. Never publish or commit it. `DATABASE_URL` is used at runtime; `DIRECT_URL` is used by the Prisma CLI. If you have both pointing to the same verified Supabase session-pooler endpoint, that is acceptable for this demo. Review any connection-string options separately for the new `pg` driver adapter.
- Back up your existing Supabase DB before any migration commands. **Do not use `prisma db push` or `prisma migrate` as part of this package upgrade.**

## Windows Command Prompt

1. Extract this ZIP into a **new folder**; copy your existing `.env` only.
2. Run the commands in this order:

```bat
node --version
npm.cmd install
npm.cmd run phase7:deps
npx.cmd prisma validate
npx.cmd prisma generate
npm.cmd run build
npm.cmd audit
npm.cmd audit --omit=dev
npm.cmd run dev
```

If `npm install` uses stale packages from an old directory, extract again to a clean folder. `npm audit fix --force` is **not** necessary or advised.

## What to test before any deployment

1. Login + email OTP; verify ordinary customer can't access `/admin` or admin APIs.
2. Existing admin sees Store Administration from `/account` and can access `/admin`.
3. Storefront product inventory and cart from Supabase show expected values.
4. A sandbox successful checkout creates an order and decrements stock exactly once; declined checkout does not.
5. Refund restores stock once, and order/refund emails arrive.
6. Restart app, confirm existing account state and order history remain intact.
7. Confirm `npm audit` and `npm audit --omit=dev` show **0 vulnerabilities** before saying the dependency security work is finished.

## Verification limitation

The patch was source-reviewed and packaged, but this environment cannot connect to npm registry. Therefore I could not install Prisma 7, generate Prisma Client, complete a full build, or validate the final audit results here. If any of your Windows commands fail, provide the full output before proceeding to deployment. Running `prisma validate` does not modify the database.
