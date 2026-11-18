# RHYTHM — Supabase PostgreSQL setup (Windows)

This project already has Prisma 6.19.0 installed in `package.json` and an existing `prisma/schema.prisma`. **Do not run `npx prisma init`.**

## 1. Configure credentials

From Command Prompt in the `rhythm-ecommerce` directory:

```bat
copy .env.example .env
```

Open `.env` in VS Code. Replace `[YOUR-PASSWORD]` in **both** `DATABASE_URL` and `DIRECT_URL` with your **Supabase database password**. For passwords containing URL-reserved characters, percent-encode those characters (for example `@` → `%40`, `#` → `%23`, `%` → `%25`). Do not share or commit your `.env` file.

The supplied host uses the Asia-Pacific session and transaction poolers you selected. If Supabase's Connect panel gives you updated URLs, use those instead.

`DATABASE_URL` (port `6543`) is for normal application queries; `DIRECT_URL` (port `5432`) is the session-pooler connection used by Prisma schema migrations. For Prisma 6.19, `directUrl` is supported in the datasource block.

## 2. Install dependencies and validate

```bat
npm install
npx prisma validate
npx prisma generate
```

The warning about `package.json#prisma` being deprecated for Prisma 7 is informational with our pinned Prisma 6 setup.

## 3. Create tables and seed products

```bat
npx prisma migrate dev --name init
npm run db:seed
```

If a command fails, stop and diagnose it before continuing. The migration operates on the Supabase database; do not point it at another database containing valuable data without reviewing the migration.

## 4. Start and check

```bat
npm run dev
```

Open:

- http://localhost:3000/api/health/db — should report connection success
- http://localhost:3000/api/catalog — should return the seeded product catalog
- http://localhost:3000 — original RHYTHM storefront (still uses demo data until later integration)

Optional database browser:

```bat
npm run db:studio
```

## What not to run

- `npm install prisma --save-dev` — unnecessary because both `prisma` and `@prisma/client` already exist in `package.json`.
- `npx prisma init` — would conflict with the existing schema and configuration.
- `npx skills add supabase/agent-skills` — optional tooling for coding agents, unrelated to connecting or migrating the database.
- `docker compose up -d` — not needed with hosted Supabase.

## Security notes

- Supabase project database credentials are secrets. Store them server-side only (`.env`), never under `NEXT_PUBLIC_` or in client components.
- Use server-side Prisma queries for customer information, orders, and payments. Do not expose tables publicly through Supabase REST APIs without explicit policies.
- Do not run real payment processing, OTP emailing, or authentication flows yet. Those remain future phases.
- Review `npm audit` before deployment; avoid automatic forced major upgrades without testing.
