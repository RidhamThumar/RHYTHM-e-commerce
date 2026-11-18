# RHYTHM — Phase 6 Admin Dashboard

## Security / first admin

There is NO self-service admin registration. An administrator must have BOTH:
1. A real confirmed Supabase login with password + email verification gate, and
2. A matching PostgreSQL `User.role = ADMIN` and their email on the server-only `ADMIN_EMAILS` allowlist.

To configure:
- Copy your working Phase 5 `.env` (NEVER upload or commit it) into this project.
- Add `ADMIN_EMAILS="your-own-verified-email@example.com"`. Only emails you control should be included; use comma-separated values if needed.
- Log in normally using that same email and finish the email OTP login, so the customer `User` database row exists.
- In **Prisma Studio** or Supabase's Table Editor, find that exact `User` record. Manually change its `role` from `CUSTOMER` to `ADMIN`. Do NOT modify unknown rows, change `auth.users`, or use a public route to grant roles. Confirm the email is your own.
- Restart Next.js after updating `.env`. Visit `/admin` while signed in with that account.

## Test / run (Windows)
```
npm.cmd install
npm.cmd run check:auth-env
npx.cmd prisma generate
npm.cmd run build
npm.cmd run dev
```
No schema changes, migrations or db push are needed for this phase.

## Verify
- Without authentication, `/admin` is restricted. All `/api/admin/*` requests must return 403.
- As a normal verified CUSTOMER (even if they manually visit API URLs), all `/api/admin/*` must return 403.
- For an ADMIN allowed by `ADMIN_EMAILS`, overview shows sandbox KPIs, product/inventory list, recent orders, coupons and customers.
- Create a product, then add a variant, update stock, feature it, hide it, and check the storefront. Never change past order-item prices.
- Process a paid DEMO order through confirmed → fulfilled → shipped → delivered and verify status changes. **These are simulated statuses; no shipments are made.**
- Create a coupon. The panel intentionally states coupon redemption is not yet implemented in checkout.
- Check that only the latest 100 entries are displayed; pagination/search is future work.
- Verify that stock changes, order statuses, and catalog changes persist across refreshes.

## Remaining scope / production warnings
- Sandbox refund remains customer-facing from the previous phase. Admin refund UI and verified live gateway refunds are future work.
- Shipping/cancellation/delivery emails have templates but are NOT automatically dispatched by these admin status actions. Do not imply real parcels or real fulfillment.
- Coupon redemption, media uploads, customer editing, detailed audit logs, pagination, and live transaction handling are NOT complete.
- All admin routes enforce server-side authorization and same-origin write checks. This is a portfolio system and needs a full security and dependency audit before public deployment.
- Do not use `npm audit fix --force` blindly. Rotate previously shared database secrets and AUTH_GATE_SECRET.
