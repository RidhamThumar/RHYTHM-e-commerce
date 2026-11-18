## Phase 5 — Test checkout and order emails

See [PHASE5_SANDBOX_SETUP.md](PHASE5_SANDBOX_SETUP.md). Payment is explicitly simulated; no bank or card charges take place.

> **Phase 4:** See [PHASE4_SHOPPING_BACKEND.md](PHASE4_SHOPPING_BACKEND.md) for new database-backed cart, wishlist, addresses, catalog, and checkout quote setup.

# RHYTHM — Premium Fashion E-commerce Portfolio Project

This project contains the full existing storefront plus **real Supabase signup email OTP** and a **password-first, email-code login flow** for protected RHYTHM pages.

**Start with [REAL_EMAIL_OTP_SETUP.md](REAL_EMAIL_OTP_SETUP.md).** It contains the Windows commands, Supabase template requirements, and the security limitations.

The project is a portfolio demonstration. Checkout and some business functions are not connected to real payment and order processing. Do not accept real payments or customer data as if this were a production shop.

## Routes

- `/` homepage; `/shop` catalog; `/product/[slug]` product pages
- `/signup` email + password registration → `/verify-email` numeric signup confirmation
- `/login` validates password server-side and requests a real email code → `/login-otp` verifies it → `/account`
- `/forgot-password` and `/update-password` use Supabase recovery links
- `/api/health/db` checks the PostgreSQL database

## Local setup

1. Copy `.env.example` to `.env`, enter the **working private Supabase PostgreSQL URLs**, the public Supabase URL and publishable key, and a randomly generated `AUTH_GATE_SECRET`. Never commit `.env`.
2. `npm.cmd install`
3. `npm.cmd run check:auth-env`
4. `npx.cmd prisma generate`
5. `npx.cmd prisma db push` (stop if Prisma warns that data could be lost)
6. `npm.cmd run build`
7. `npm.cmd run dev`

Your existing eight products remain in the database. Do not rerun the seed script.
