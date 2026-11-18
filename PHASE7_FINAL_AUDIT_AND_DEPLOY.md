# RHYTHM Phase 7 — Security, Testing and Deployment

**Scope:** this release is a *sandbox portfolio demonstration* with simulated payments, order emails, and invited test accounts. This is not a live commercial checkout or production security certification.

## Changes in this release

- Customer database records now bind to the immutable Supabase Auth `user.id` via nullable, unique `User.supabaseAuthId`. Existing accounts are linked on their next verified login. A previously linked record cannot be silently reused by a different Supabase identity that happens to control the same email address. **A changed email on the same Supabase account currently requires manual migration under an administrator's supervision; it fails closed.**
- Set a minimum Next.js 15.5.29 dependency range for new installations. Do *not* upgrade Prisma/Next/React major versions casually.
- Add `X-Content-Type-Options`, frame-blocking, restrictive browser feature permissions, and referrer policy headers. No restrictive CSP is enforced yet because the existing inline styles and remote images need a measured rollout.
- Tighten OAuth/email callback redirect normalization.
- Exclude private customer, account, auth, admin, checkout and API paths from `robots.txt`. This is **not** an access-control mechanism.
- Add `npm run phase7:preflight` to check deployment configuration **without printing credentials**.

## Windows installation and safe schema update

1. Extract this project into a **new** directory.
2. Copy `.env` from the *working* Phase 6 directory. Keep SMTP credentials and `AUTH_GATE_SECRET` secret; add `ADMIN_EMAILS` if absent. Never upload `.env` to GitHub.
3. Because old database credentials and the gate secret were exposed in prior chat messages, rotate both before publishing. Update `.env` appropriately and invalidate previous authentication sessions as part of the rotation plan.
4. Run the following from the extracted `rhythm-ecommerce` directory, **one command at a time**:

```bat
npm.cmd install
npm.cmd run check:auth-env
npm.cmd run phase7:preflight
npx.cmd prisma validate
npx.cmd prisma generate
npx.cmd prisma db push
npm.cmd run build
npm.cmd audit --omit=dev
npm.cmd audit
npm.cmd run dev
```

`prisma db push` is needed this time because `User.supabaseAuthId` was added. **Do not accept a data-loss warning, reset, or force operation.** Back up the database before changing its schema. Review differences against your Phase 6 schema if prompted; only the nullable, unique identity binding is expected. Keep the existing Supabase project; do not re-seed or reset tables.

If the audit reports vulnerabilities, capture `npm audit --json` and review exact package names, patched versions, and breaking changes. Never use `npm audit fix --force` without a controlled upgrade and retest.

## Manual security and regression gate

1. Admin account: finish password + email OTP; verify `/account` has the admin navigation and `/admin` works.
2. Regular customer: no admin link; direct `/admin` and `/api/admin/*` calls are denied, including direct POST/PATCH requests.
3. Logged-out visitor: private `/api/shop/*`, `/api/checkout/*`, and `/account/*` must not return account data.
4. OTP: wrong, expired, reused and throttled codes fail; ordinary password sessions cannot bypass second-factor protection; logout closes access.
5. Cart: merge on login, repeated size/quantity updates, zero-stock rejection, reload, account isolation.
6. Checkout: server-side subtotal, 2 simultaneous attempts at the last item, idempotency key replay, declined payment, successful sandbox order, and repeated refund attempts. Confirm exactly one order and no negative inventory.
7. Order notifications: confirmation and refund messages arrive once, contain correct customer/order amounts, and include an unambiguous **test order / no real charge** notice.
8. Admin product edits: create/hide/edit products, sizes and stock. Ensure archived products are not purchasable.
9. Responsive UI: Chrome/Firefox/Edge (desktop), narrow mobile viewport, keyboard-only navigation, missing product imagery, empty states, loading and form errors.
10. Review dependency audit and rerun a production build after every patch.

**Known gaps that block a production public customer store:** no real payment provider; Gmail SMTP deliverability/limits; no distributed/edge rate limiting for public auth endpoints; no automated browser E2E suite; no proper durable email job queue, failure retries, or delivery tracking; no CSP; no formal accessibility audit; some planned shipping/coupon workflows still not fully wired. Keep the demo invitation-only until these are reviewed.

## Deployment plan (only after gates pass)

1. Create a **private GitHub repository** initially, verify `.gitignore` excludes `.env*`, `node_modules/`, `.next/`. Run `git status` and `git ls-files` to confirm no credentials are tracked.
2. Deploy a preview to hosting that permits the intended portfolio usage. Review your host's usage restrictions before choosing a free tier.
3. Add the five baseline server environment values (`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `AUTH_GATE_SECRET`), your `ADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL`, and optional order SMTP variables using the host's encrypted settings—not repository files.
4. Update Supabase Auth URL Configuration: site URL + explicit preview/production redirect URLs. Avoid broad wildcard redirects on the production domain.
5. Ensure the host supports the Node.js runtime required for Prisma and Nodemailer; verify outbound SMTP connectivity before testing order emails.
6. Run a deployed preview smoke test with a disposable user, separate admin and customer accounts, fake checkout and refunds; verify no real charge occurs.
7. Capture screenshot/video evidence and document that payment is *simulated*. Add a GitHub README with architecture, screenshots, setup instructions, features, limitations and test results.

## Status and limitations of this package

- **Source updates authored:** yes.
- **Static TS/TSX syntax pass:** performed separately during packaging.
- **Successful full Next.js build:** **not verified here** because npm install could not complete in the current environment.
- **Database migration or live browser test:** **not performed here**; run on your Windows workstation.
- **Production launch:** **not approved** until dependency issues, secret rotation and security tests above pass.
