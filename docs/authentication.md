# RHYTHM — Real Email OTP (Signup and Password + Email OTP Login)

This update uses Supabase Auth, its configured custom SMTP sender, and a database login-challenge table. **No Gmail app password belongs in Next.js**; the email is sent by Supabase using your existing SMTP settings. Signup OTP uses the Confirm signup template; login OTP uses the Magic link or OTP template. Both must contain `{{ .Token }}` and email OTP length must be 6 digits.

## First-time installation (Windows Command Prompt)

1. Copy your working private `.env` into this project root. Do not share it or commit it.
2. Add `AUTH_GATE_SECRET` using a random value: run `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and put the output into `.env` without exposing it.
3. Install: `npm.cmd install`
4. Check: `npm.cmd run check:auth-env`
5. Generate: `npx.cmd prisma generate`
6. Create the new login-challenge table: `npx.cmd prisma db push`. **Do not accept any data-loss prompt**. The ZIP does not contain your previously generated local migration files, and `migrate dev` could suggest resetting an existing database.
7. Build: `npm.cmd run build`
8. Launch: `npm.cmd run dev`

**Do not run db:seed again**. Your earlier database migration and products remain unchanged.

## Test in this order

1. `/api/health/db` returns connected.
2. New email `/signup` → Supabase Confirm signup template sends a six-digit code → `/verify-email` accepts it → redirected to `/login`.
3. `/login` checks email/password server-side, then Supabase sends a new email code. Open `/login-otp`, enter code, reach `/account`.
4. Wrong code / expired code / more than five attempts are rejected. Resend is rate-limited to once/minute.
5. Logout returns you to `/login`. Direct `/account` redirects to login unless both Supabase session and a signed OTP-verification gate exist.
6. `/forgot-password` keeps Supabase's existing recovery-link flow. A recovered or independently created auth session does **not** bypass the login OTP gate on `/account`.

## Security and limitations

- Supabase may intentionally return an ambiguous response to duplicate signup; never expose whether an arbitrary email exists.
- Public Supabase publishable keys are expected; NEVER use service-role keys in the browser.
- This is a limited portfolio implementation, not a certified production authentication service. It protects `/account` via a server-side gate bound to the Supabase session ID. Any **future private server route** must call `hasVerifiedLogin()` (in `src/lib/auth/login.ts`).
- Keep database tables private (no public Data API grants); enforce RLS for any exposed tables.
- Rate limits are per-account, not a substitute for IP-based abuse protection or CAPTCHA. Supabase Auth may also throttle email. Enable CAPTCHA before unrestricted public testing.
- The only email-sending service configured in Next.js is Supabase; Gmail credentials remain exclusively in the Supabase SMTP settings.
- A signed verification cookie expires after 12 hours; reauthentication creates a different session ID and requires a new OTP.
- The OTP is validated by Supabase, not stored or logged by RHYTHM.
- Do not use real customer data or accept live money in this portfolio demo.
- Previously shared database credentials should be rotated, and npm audit findings must be reviewed.
