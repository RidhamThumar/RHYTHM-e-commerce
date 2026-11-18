# RHYTHM — Phase 5: Sandbox orders and transactional email

**This is an internal payment simulation, NOT Stripe/Razorpay test-mode integration.** Never accept or ask for card numbers. It does not move any money. The order and stock changes are real in your existing **test Supabase database**, and the order records are deliberately tagged `PaymentProvider.DEMO`.

## Setup on Windows (Command Prompt)

1. Extract this ZIP into a new directory.
2. Copy the **existing, working** `.env` file from Phase 4. Keep `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `AUTH_GATE_SECRET` unchanged. Do not copy `.env` into GitHub or chat.
3. **Rotate** database passwords and the auth gate secret previously exposed in chat before public sharing, and update `.env` accordingly.
4. If you want real *order confirmation / refund notifications* to be sent (separate from Supabase Auth's Gmail SMTP configuration), add these **server-only** variables to `.env`:

```
ORDER_SMTP_FROM="your-dedicated-sender@gmail.com"
ORDER_SMTP_APP_PASSWORD="YOUR_GOOGLE_APP_PASSWORD"
```

Google App Password is the 16-character app password, not the Gmail account password. SMTP is optional; if omitted orders still work but the `OrderNotification` row records `NOT_CONFIGURED`. Public traffic should use a verified-domain transactional provider instead. The browser never receives these variables.

5. Install and verify, **one command at a time**, stopping on any failure:

```
npm.cmd install
npm.cmd run check:auth-env
npx.cmd prisma generate
npx.cmd prisma db push
npm.cmd run build
npm.cmd run dev
```

**Do not approve any destructive Prisma warning** (drop/reset/data loss). Since Phase 4's ZIP did not include complete migration history, `prisma db push` updates the existing test schema without resetting it. Save a database backup before running against anything valuable.

## Test the customer journey

- Sign in with email + password + real second-step email OTP.
- Confirm `/api/health/db` works, and that Phase 4 product search/cart/wishlist still work.
- Add product (size/quantity) to authenticated cart, open `/checkout`.
- Choose **Simulate declined payment**: see an error; no paid order or stock deduction.
- Choose **Simulate successful payment**: order is created, its test payment is marked `SUCCEEDED`, and variant stock decreases atomically. Order should appear in `/account/orders`. Cart should be empty upon revisiting.
- Refresh `/account/orders`, confirm your order status and whether its confirmation email is `SENT`, `FAILED`, or `NOT_CONFIGURED`.
- Click **SIMULATE REFUND** on your test order: order/payment become `REFUNDED` and stock restores once. An optional refund email is recorded/sent.
- Open Supabase Table Editor and inspect `Order`, `OrderItem`, `Payment`, `ProductVariant`, `OrderNotification`. All monetary amounts are stored as integer cents.
- Test signing out: protected order and refund API routes should no longer work.
- Retest Phase 4 cart, filters, wishlist, address book, login OTP; they should remain intact.

## Scope and limitations

- **No live or external gateway:** checkout uses only a clearly labeled local simulated success/decline flow. Stripe/Razorpay sandbox integration, signed webhooks, provider reconciliation, and real payment receipts have NOT been implemented.
- **No shipping carrier integration:** shipping status updates/notifications and customer support tools are Phase 6/admin tasks.
- No automatic email retries; the notification table records failures. Gmail SMTP is rate limited and best suited to invited demonstrations.
- The order confirmation is sent **only after** the database transaction commits; email failure does not undo an order.
- Orders are limited to signed-in, email-OTP-verified users. Guest shopping still works, but guest checkout must sign in.
- Duplicate checkout requests with the same key are idempotent. Stock decrement uses a conditional SQL update in a serializable transaction. Another shopper cannot spend your saved bag.
- Database access and real SMTP delivery require local validation. An offline syntax check is not a Next.js production build.
- Run `npm audit` and review the pre-existing dependency advisories before public deployment. Do not run `npm audit fix --force` without reviewing breaking updates.
