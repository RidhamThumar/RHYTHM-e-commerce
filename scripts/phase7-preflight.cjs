const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');
if (fs.existsSync(envPath)) require('dotenv').config({ path: envPath });
let failures = 0;
const check = (test, label) => { console.log(`${test ? 'PASS' : 'FAIL'}: ${label}`); if (!test) failures++; };
const validURL = (v) => { try { const x = new URL(v); return x.protocol === 'https:'; } catch { return false; } };
check(validURL(process.env.NEXT_PUBLIC_SUPABASE_URL), 'Supabase project HTTPS URL');
check((process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '').startsWith('sb_publishable_'), 'Supabase publishable key');
for (const k of ['DATABASE_URL', 'DIRECT_URL']) {
  let good = false;
  try { const u = new URL(process.env[k]); good = u.protocol.startsWith('postgres') && !!u.password && u.hostname.includes('supabase.com') && !u.password.includes('YOUR_'); } catch {}
  check(good, `${k} formatted as PostgreSQL connection URL (not an actual connection test)`);
}
const gate = process.env.AUTH_GATE_SECRET || '';
check(/^[0-9a-f]{64}$/i.test(gate) && gate !== '0'.repeat(64), '64-hex-character auth gate secret');
check(!!(process.env.ADMIN_EMAILS || '').split(',').map(x => x.trim()).filter(x => x.includes('@')).length, 'Explicit admin email allowlist');
check(fs.existsSync(path.join(root, 'prisma', 'schema.prisma')), 'Prisma schema present');
check(!fs.existsSync(path.join(root, '.env.production')), 'No local production secrets file');
check(!fs.existsSync(path.join(root, '.git')) || require('node:child_process').spawnSync('git',['ls-files','--error-unmatch','.env'],{cwd:root,stdio:'ignore'}).status !== 0, 'Never commit .env');
const isEmailConfigured = !!process.env.ORDER_SMTP_FROM && !!process.env.ORDER_SMTP_APP_PASSWORD;
console.log(`INFO: Order SMTP configured: ${isEmailConfigured ? 'yes' : 'no'} (no SMTP test attempted)`);
console.log(`Preflight ${failures ? 'FAILED' : 'PASSED'} (${failures} failures). Does not replace a live security review.`);
process.exitCode = failures ? 1 : 0;
