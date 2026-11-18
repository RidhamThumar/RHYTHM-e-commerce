# RHYTHM — Vercel + Supabase deployment (portfolio sandbox)

This project uses Next.js 15.5.29, Prisma 7.10.1 with @prisma/adapter-pg, Supabase Auth/PostgreSQL, and simulated payments. It is **NOT** a real payment-processing store. Do not imply customers are charged or products will be shipped. The code was built and npm-audited on the user's Windows machine before the deployment-only `postinstall` change; this modified ZIP has NOT been deployed or built by the assistant.

## 1. Protect secrets and back up data BEFORE making the project public

- Rotate the database password in Supabase (older password was pasted into chat). Update both DATABASE_URL and DIRECT_URL to the newly rotated URL. Percent-encode reserved characters in passwords. Verify connection. Do not rotate in an uncoordinated way that breaks your running app.
- Replace AUTH_GATE_SECRET with a newly generated key (old one was exposed); this invalidates existing verification cookies and requires users to log in again: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- Rotate Gmail app password **if exposed**; do not put it in Git. Avoid using a personal Gmail account for public traffic.
- Back up the Supabase database. Do not run `prisma db push`, `migrate dev`, or seed against production simply because you are deploying. Your current schema was already synced in Phase 7.
- Verify `.env` and `.env.local` are ignored; inspect the GitHub staged files before commit. Never set secrets with a `NEXT_PUBLIC_` prefix, except the intended Supabase public URL and publishable key.
- Use invited test accounts for this sandbox; public production auth requires further abuse protection/rate limiting and real email deliverability controls.

## 2. Push the correct project folder to GitHub

In Windows Command Prompt, inside the extracted `rhythm-ecommerce` directory:

```bat
npm.cmd install
npm.cmd run build
npm.cmd audit
git init
git add .
git status
git commit -m "Prepare RHYTHM portfolio demo for Vercel"
git branch -M main
```

Review `git status` BEFORE committing; ensure `.env` and other secrets aren't listed. Create an **empty** GitHub repository and follow its Git remote instructions:

```bat
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

If Git asks for identity set your own `git config user.name` and `git config user.email`. If a remote already exists, adjust it instead of adding a duplicate.

## 3. Import into Vercel

Go to https://vercel.com/new, choose **Import Git Repository**, select the GitHub RHYTHM repo, choose framework **Next.js** and root directory `rhythm-ecommerce` **only if** you pushed an enclosing directory; if you ran `git init` inside `rhythm-ecommerce`, use the default repository root `/`.

Install command: `npm install` (default). Build command: `npm run build` (default). The `postinstall` script generates the Prisma 7 client at install time (important on Vercel).

Under Vercel Project > Settings > Environment Variables, configure **Production** values BEFORE deploying (and Preview only when appropriate):

| Variable | Value |
|---|---|
| DATABASE_URL | Supabase pooler PostgreSQL URL with current rotated password and `sslmode=require` |
| DIRECT_URL | Current Supabase PostgreSQL URL used by prisma.config.ts; existing verified pooler URL works if suitable |
| NEXT_PUBLIC_SUPABASE_URL | Your actual `https://...supabase.co` URL |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | Supabase publishable key (`sb_publishable_...`) |
| AUTH_GATE_SECRET | New private 64-character hex key |
| ADMIN_EMAILS | Comma-separated exact login emails for admins, matching User.role=ADMIN |
| ORDER_SMTP_FROM | Gmail sender mailbox, e.g. a brand Gmail address |
| ORDER_SMTP_APP_PASSWORD | Dedicated Google app password, server-side only |
| NEXT_PUBLIC_SITE_URL | Final `https://<your-vercel-domain>` domain used in email links |

Do **not** upload the `.env` file or paste its contents into GitHub. `NEXT_PUBLIC_SITE_URL` is an intentional public URL, not a secret.

Vercel gives a `.vercel.app` domain after initial deployment. Use that URL for `NEXT_PUBLIC_SITE_URL` and redeploy if you couldn't enter it before the first deployment. Project Settings -> Environment Variables updates apply to later deployments, not prior ones.

## 4. Update Supabase Auth URLs

Supabase Dashboard -> Authentication -> URL Configuration:

- **Site URL:** `https://YOUR_PROJECT.vercel.app` (your real production domain).
- **Redirect URLs:** include `https://YOUR_PROJECT.vercel.app/**` and, if needed for local testing, `http://localhost:3000/**`.
- Review Supabase email templates: recovery and confirmation links must use the correct site/redirect URL; the 6-digit OTP templates must retain `{{ .Token }}`.
- Confirm custom SMTP config is still operating. The app's ORDER_SMTP_* SMTP settings are separate from Supabase Auth SMTP.

## 5. Promote / verify

Vercel should automatically build and deploy the main branch. Alternatively use Vercel CLI (`npm i -g vercel`, `vercel login`, `vercel --prod`) from the app folder. Inspect Vercel build logs for Prisma generation errors and Function logs for DB/SMTP failures.

On the **live domain**, check at minimum:

1. Home and shop load; products are retrieved from Supabase.
2. Signup, email OTP verification, password+OTP login, logout and password recovery use the deployed domain.
3. A regular customer cannot access `/admin` or `/api/admin/*` (test API writes as well as reads).
4. The authorized admin can access /admin; product and stock changes work.
5. Sandbox successful checkout creates exactly one test order; decline does not charge; refund restores stock.
6. Confirmation and refund emails arrive with correct amounts and **no real charge** notice.
7. Check Vercel runtime logs. Review mobile layout, accessibility and speed.

If any critical flow fails, unpublish/restrict the demo until fixed. **An `npm audit` result of zero and a successful build do not constitute a penetration test.** The current sandbox should remain clearly labeled; use access restrictions or invited testers until auth rate limits, email handling, and comprehensive runtime security tests are verified.

## 6. Connecting a custom domain (optional)

Vercel Project -> Settings -> Domains. Follow the displayed DNS records exactly. Then update `NEXT_PUBLIC_SITE_URL` on Vercel, Supabase Site URL/Redirect URLs, and redeploy. Ensure HTTPS is active.

## Official documentation

- https://vercel.com/docs/projects/deploy-from-cli
- https://vercel.com/docs/environment-variables
- https://www.prisma.io/docs/orm/v7/prisma-client/deployment/serverless/deploy-to-vercel
- https://supabase.com/docs/guides/auth/redirect-urls
