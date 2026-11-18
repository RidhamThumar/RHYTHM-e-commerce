# RHYTHM — Phase 4: Database-backed Shopping

This is an **update to the same RHYTHM Next.js project**, based on `RHYTHM_Real_Email_OTP_Phase3.zip`. It preserves the existing email OTP configuration and the Supabase database.

## What actually works in this phase

- Homepage, `/shop`, and product details load **active products and size/stock values from PostgreSQL** (Prisma).
- Filtering and price sorting operate on the live catalog. Size filtering only shows products with available stock for the selected size.
- Guest visitors may use a temporary browser-stored bag and wishlist.
- Users who complete **Supabase sign-in AND the second email OTP gate** have database-backed cart and wishlist records tied to their own customer profile.
- Cart quantity mutation checks valid product, valid size, available inventory, and max 10 per variant on the server. Mutations do **not** trust browser prices.
- Guest cart/wishlist items are merged into a verified customer's stored bag once per user/browser. Successful merge clears local guest storage.
- `/account/addresses` allows saving and removing customer delivery addresses.
- `/account/orders` securely displays existing order records, if any.
- Authenticated checkout can request a fresh server-calculated **quote** including shipping and out-of-stock flags.

## Intentionally **not** done yet

- Checkout remains a **non-transactional preview**: no payment is captured, no stock is reserved, and no order is placed. The form should not be used for real personal or card information.
- Real order creation, inventory reservation/decrement, payment webhook processing, refunds, and admin CRUD are **Phase 5+**. Order history stays empty until orders are legitimately created.
- The email OTP gate in Phase 3 was custom and is not a substitute for a professional security audit. All future private APIs must enforce it, too.

## Installation / Windows Commands

1. Extract ZIP, and copy your **working** `.env` into `rhythm-ecommerce` (beside `package.json`). Do **not** upload or commit `.env`.
2. Keep the five secrets/settings: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `AUTH_GATE_SECRET`. Use your working session pooler on port 5432 in local development.
3. Open Command Prompt in the project folder and run one at a time:

```bat
npm.cmd install
npm.cmd run check:auth-env
npx.cmd prisma generate
npm.cmd run build
npm.cmd run dev
```

The Prisma schema is **unchanged from Phase 3**: do not rerun `prisma db push` or migrations unless your local database schema differs. Do not run the seed command again unless you intentionally want to seed missing catalog products.

## Manual acceptance tests

1. Go to `/api/health/db` and `/api/catalog` (check the 8 seeded items) and view `/shop`.
2. As a **guest**, add a size-specific product to the bag, reload, verify it persists; toggle wishlist; verify checkout is explicitly a preview.
3. Sign in and finish real **email OTP**. Navigate to `/cart`, confirm guest bag merged, refresh, then open a new tab: saved items should remain.
4. Change quantity and remove items; verify cart totals respond. Try exceeding available size stock: it must reject the request.
5. Add/remove wishlist items and refresh; confirm persistence. Check that a second account cannot view the first account's data.
6. On `/account/addresses`, add an address, reload, and remove it.
7. On `/account/orders`, expect no orders yet. Check `/checkout` shows the server quote for authenticated users but does **not** place orders.
8. Sign out and verify the previous account's saved items are **not** visible as another guest or user.
9. If a step fails, share the **first** error/terminal output, but **never** share `.env`, secrets, or SMTP passwords.

## Known engineering limitations

- A connection drop causes a visible store error, not silently stale catalog data.
- A separate production assessment is required for: transaction-safe stock reservation at payment time, correct tax/shipping by geography, error recovery, offline sessions, auth gate hardening, CSRF, and rate limiting.
- Free SMTP via Gmail is for a limited portfolio demo; it may rate-limit or suspend bulk auth mail.
- Run `npm audit` and address the existing dependency advisories before any public deployment; avoid `npm audit fix --force` without reviewing breaking changes.
- The `*.env` secrets are gitignored; rotate the database password that was exposed earlier in the conversation.
