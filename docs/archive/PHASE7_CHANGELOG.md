# Phase 7 code audit findings

**Addressed in source**
- Previously the local user profile was retrieved by email alone. This permits ambiguity if emails change or are reassigned. A nullable, unique Supabase identity binding was introduced for verified logins and existing customer records.
- Earlier builds accepted Next.js `^15.5.0`, which can resolve to outdated 15.5 patch builds. Minimum raised to 15.5.29; actual installed version is verified by `npm ls next` and security advisories.
- Basic HTTP security headers were missing.
- Auth callback `next` parameter now rejects backslashes and control characters in addition to protocol-relative URLs.
- Added a safe preflight command and private-route crawl rules.

**Still open**
- A customer who changes email within Supabase Auth will need explicit safe account migration (blocked rather than granting accidental access).
- OTP and API rate limiting should be moved to a durable store with per-IP and per-account controls, preferably with a managed edge limiter and abuse monitoring.
- Receipt emails are sent inline after a transaction rather than by a durable queue.
- A nonce-based CSP and automated functional/security tests remain to be implemented.
- `npm audit` may identify six or more issues, dependent on versions resolved at install time; exact advisories must be collected locally.
- Hosting, domain, email deliverability and production performance remain unverified.
