# RHYTHM — Phase 7 Dependency Patch (Round 1)

This is the **complete** Phase 7 project, based on `RHYTHM_Phase7_Security_Audit_Starter.zip`. It preserves the Phase 6 admin-navigation integration.

## Changes

- Upgrade `nodemailer` from 6.x to **10.3.1** (current supported major; fixes reported advisory range). Maintains the Gmail SMTP `createTransport(...).sendMail(...)` call used by RHYTHM. Node.js **20+** required.
- Remove `@types/nodemailer` because Nodemailer 10 ships its own TypeScript declarations.
- Override transitive `postcss` to **8.5.32** without upgrading Next.js to 16. This is a deliberately scoped transitive dependency override; a Next.js 16 migration should be separately planned and tested.
- Retain **Next.js 15.5.29**, the most recent patched 15.x backport at time of preparation.
- Retain **Prisma 6.19.0** while evaluating the Prisma 7 major migration; it is not safe to silently force this in a live project without build/DB regression testing.
- Add a read-only `npm.cmd run phase7:deps` check.

## Exact Windows steps

1. Back up your current working folder. Extract this ZIP to a new folder.
2. Copy the existing `.env` **locally** to the new `rhythm-ecommerce` folder. Never upload it or commit it.
3. Open Command Prompt in the new `rhythm-ecommerce` folder.
4. Check Node version: `node -v` (must be Node 20+).
5. Run the following **in order**:

```bat
npm.cmd install
npm.cmd run phase7:deps
npm.cmd audit
npm.cmd audit --omit=dev
npx.cmd prisma generate
npm.cmd run build
npm.cmd run dev
```

`npm install` must rebuild your local `package-lock.json` with these new resolutions. This ZIP does not ship an unverified lockfile. **Do not copy the old `package-lock.json`** into this new folder. After a successful install, keep and commit the newly generated lockfile, **not** your `.env`.

## What to expect

- The Nodemailer and PostCSS advisories **should** disappear if the pinned versions install as intended; verify using `npm audit`.
- Prisma 6's `@prisma/config` may still pull vulnerable `effect` and `deepmerge-ts`. They are associated with the Prisma CLI/dev toolchain; verify whether they remain in `npm audit --omit=dev`. This does **not** mean any vulnerability is automatically harmless. We need to review whether and how the app uses affected paths.
- A fully green `npm audit` is **not guaranteed** by this package. Major Prisma upgrades require a distinct migration and testing pass.
- Run a successful simulated order and refund, and check the redesigned email messages reach the inbox after the Nodemailer update.
- The DB schema is **unchanged** relative to the previous Phase 7 ZIP. Do not run `prisma db push` again just for this dependency patch.

## Cautions

- **Do not run `npm audit fix --force`.**
- Never commit `.env`; rotate the previously exposed database password and `AUTH_GATE_SECRET` before public deployment.
- This work was source-reviewed and package-file validated but **could not be built or audited using npm in this environment** because the container cannot reach the npm registry. Final verification must happen on your Windows machine.
- If `npm.cmd run build` fails, send the full error log; don't deploy until it passes.
