# RHYTHM — Windows setup and verification

This update fixes implicit TypeScript `any` in both the server-side Supabase cookie adapter and middleware. It does **not** include your credentials.

## 1. Environment variables (required)

In the **new extracted folder** `rhythm-ecommerce`, place a file named `.env` (not `.env.txt`). Copy your **working** `.env` from the previous RHYTHM database folder; do not copy `.env.example` over it. Keep `DATABASE_URL` and `DIRECT_URL`. Add:

```env
NEXT_PUBLIC_SUPABASE_URL="https://trahkcxufdhdaikccjdy.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<actual publishable key from Supabase dashboard>"
```

Find the key under Supabase → Project Settings → API Keys. Never use a secret/service-role key for the NEXT_PUBLIC variable. Store `.env` locally; do not commit or share it. If you previously disclosed a database password, rotate it in Supabase and update your connection strings.

## 2. Run in Windows CMD

```bat
npm.cmd install
npm.cmd run check:auth-env
npx.cmd prisma generate
npm.cmd run build
npm.cmd run dev
```

Stop if a command fails. The environment check must print SET four times. If not, check that `.env` is in the root of the **current** folder and does not contain placeholders.

## 3. Browser checks

Visit /, /shop, /signup, /login, /account. With Supabase default outbound email settings, delivery can be rate-limited or limited to approved addresses. Email OTP and password+OTP on every sign-in are not equivalent; this starter currently implements password login OR email-code login.

## 4. Important limits

The project has not passed an end-to-end live auth test in the packaging environment. Audit dependencies with `npm audit` (avoid `npm audit fix --force` without review), and test login/signup/verification and session behavior before production use.
