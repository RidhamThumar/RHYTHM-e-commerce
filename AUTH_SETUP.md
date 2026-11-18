# RHYTHM — Phase 3: Supabase Auth (development, no SMTP)

This builds upon the **existing** RHYTHM/Supabase PostgreSQL project. No extra Prisma migration is required for these auth routes. The Supabase Auth service owns credential hashes, sessions, OTP tokens, and identity records in `auth.users`; do not store or create passwords in the Prisma `User` table.

## Windows setup

1. Extract the ZIP to a new folder. Copy your **working** `.env` from the previous `RHYTHM_Supabase_Corrected/rhythm-ecommerce` folder into the new project's root. (Never share or commit that file.)
2. Add these lines to the new `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL="https://trahkcxufdhdaikccjdy.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="PASTE_YOUR_PUBLISHABLE_OR_ANON_KEY_HERE"
```

3. In Supabase dashboard go to **Project Settings → API Keys** and copy the **publishable key** (`sb_publishable_...`), or if only available, the legacy **anon public** key, into `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never use a secret or service-role key there.
4. In Supabase **Authentication → Sign In / Providers**, verify Email and Confirm email are enabled (already configured). In **Authentication → URL Configuration** set site URL `http://localhost:3000` and allow `http://localhost:3000/**` (already configured).
5. In PowerShell run:

```powershell
npm.cmd install
npx.cmd prisma generate
npm.cmd run dev
```

6. Visit `http://localhost:3000/signup`, register with an email address permitted by your Supabase project's built-in email service; use the confirmation **link** in the email if it does not include a numeric code. After confirmation test `/account`, sign out, login, forgot-password and recovery. In Supabase Authentication → Users check the new account.

## Important development behavior

- Without custom SMTP, Supabase's built-in email sender has restricted throughput and may only send to authorized/test addresses. This may prevent an arbitrary email address from receiving messages. If this happens, no amount of frontend coding will bypass that restriction. Consider testing with permitted project emails or use Supabase local Auth with an inbox emulator (requires additional local infrastructure).
- The **signup verification form** supports a six-digit code **only if** the Supabase confirmation email template contains `{{ .Token }}`. With the uneditable default template, use the email **confirmation link** instead. The `/auth/callback` route handles PKCE code exchange.
- The **email-code login option** uses Supabase's `signInWithOtp` and is **passwordless**, not password + OTP. It may deliver a magic link if its template does not include `{{ .Token }}`. A login that obligatorily checks *both* password and OTP needs a separate, secure MFA flow and is not claimed as complete here.
- Duplicate signup behavior intentionally avoids revealing which email addresses exist. Existing accounts cannot be created twice with the same verified identity; the user should sign in.
- Auth tokens are kept in SSR cookies and refreshed in Next.js 15 `middleware.ts`. Server-protected `/account` validates the current Auth user; browser-local cart and wishlist are not yet account-specific.
- Password recovery uses the default email link, then `/update-password` after cookie/session exchange. Test delivery and callbacks; don't assume emails were sent when requested.
- Prisma's `User` record is mirrored by **verified email**, with a distinct ID from `auth.users` for now. Before production, add a stable Supabase `auth.users.id` foreign-key mapping and implement authorized account order queries.
- OTP resend and throttling are managed by Supabase Auth; configure appropriate rate limits. This app does not claim to enforce its own MFA.
- **Rotate the database password disclosed earlier** before using any real customer data. Never send passwords or full database URLs in chat.

## What is NOT done

No live transactions, shipping backend, server-side carts, payment verification, secure admin, full end-to-end browser test, or mandatory email MFA after password login. Production needs a verified email sender, security review, and updates to any vulnerable dependencies.
