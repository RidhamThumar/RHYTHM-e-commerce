# RHYTHM — Fix missing Supabase Auth config

The account page previously crashed if the public Supabase config was absent. It now shows an explicit setup notice instead. **The login system still cannot work until you configure your own key.** No ZIP can legitimately embed your private project's key automatically.

1. In the new `rhythm-ecommerce` folder, copy your **working `.env`** file from the previous database project (do not share or upload it).
2. Add or update these variables, retaining your working `DATABASE_URL` and `DIRECT_URL`:

```env
NEXT_PUBLIC_SUPABASE_URL="https://trahkcxufdhdaikccjdy.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="PASTE_YOUR_PUBLISHABLE_KEY_HERE"
```

3. In Supabase Dashboard → Project Settings → API Keys copy **publishable** (`sb_publishable_...`) or legacy **anon public** key. Never use `secret` or `service_role` here.
4. From PowerShell in the project folder run:

```powershell
npm.cmd install
npm.cmd run check:auth-env
npx.cmd prisma generate
npm.cmd run build
npm.cmd run dev
```

Stop if any command errors. After editing `.env` stop and restart the dev server (`Ctrl+C`, `npm.cmd run dev`). Open `/login`, `/signup`, `/account` and use a permitted test email.

**Caveats:** We cannot verify live Supabase credentials, deliverability, or browser journeys in this source-only review. Without SMTP, default email delivery may be restricted and may use a link rather than a six-digit code. Password login + mandatory OTP is not implemented; the available email-code flow is an *alternative* login method. Database credentials previously posted in chat should be rotated. Do not put actual `.env` values in GitHub.
