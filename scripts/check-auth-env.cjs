// RHYTHM Auth environment check. Never prints values or secrets.
require('dotenv').config();
const required = ['DATABASE_URL', 'DIRECT_URL', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'AUTH_GATE_SECRET'];
let fail = false;
for (const name of required) {
  const value = process.env[name];
  const valid = Boolean(value && !value.includes('PASTE_YOUR') && !value.includes('[YOUR-PASSWORD]') && !value.includes('YOUR_PASSWORD') && !value.includes('YOUR_RANDOM_'));
  console.log(`${name}: ${valid ? 'SET' : 'MISSING/PLACEHOLDER'}`);
  if (!valid) fail = true;
}
const gate = process.env.AUTH_GATE_SECRET || '';
if (gate && gate.length < 32) { console.error('AUTH_GATE_SECRET must contain at least 32 random characters.'); fail = true; }
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
if (url && !/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)) {
  console.error('NEXT_PUBLIC_SUPABASE_URL should be your Supabase project HTTPS URL.'); fail=true;
}
if (fail) { console.error('Missing configuration: copy your working database .env from the previous project into this project root, then add your Supabase public URL and publishable key. Do not paste secrets in chat. Restart Next.js after saving.'); process.exitCode=1; }
else console.log('Environment entries are present (not a live authentication test).');
