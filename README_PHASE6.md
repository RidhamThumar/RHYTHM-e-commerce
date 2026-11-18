# Phase 6 — Store Management

Admin dashboard: `/admin`. See `PHASE6_ADMIN_SETUP.md` to configure a **manual** database role AND a server-side email allowlist. The dashboard deliberately does not grant admin privileges to ordinary signups.

Modules: `src/lib/admin`, `src/app/api/admin`, `src/components/admin`, `src/app/admin/page.tsx`.

Preserves prior Phase 5 storefront, auth, sandbox checkout, inventory and order-confirmation email features. This update does not change the Prisma schema.
