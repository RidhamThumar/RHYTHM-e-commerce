import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export const CHALLENGE_COOKIE = 'rhythm_email_login_challenge';
export const GATE_COOKIE = 'rhythm_login_verified';
const HOUR = 60 * 60 * 1000;
export const CHALLENGE_SECONDS = 300;

export function isolatedAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase configuration');
  return createSupabaseClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

function secret() {
  const s = process.env.AUTH_GATE_SECRET;
  if (!s || s.length < 32 || s.includes('YOUR_')) throw new Error('Configure AUTH_GATE_SECRET with at least 32 random characters in .env');
  return s;
}

function b64(v: string) { return Buffer.from(v).toString('base64url'); }
function signature(payload: string) { return createHmac('sha256', secret()).update(payload).digest('base64url'); }

export function getSessionId(accessToken: string): string | null {
  try {
    const parts = accessToken.split('.');
    if (parts.length !== 3) return null;
    const payload: unknown = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (!payload || typeof payload !== 'object' || !('session_id' in payload)) return null;
    const id = payload.session_id;
    return typeof id === 'string' && id.length > 0 ? id : null;
  } catch { return null; }
}

export function createGateToken(userId: string, sessionId: string) {
  const expires = Date.now() + 12 * HOUR;
  const data = b64(JSON.stringify({ userId, sessionId, expires }));
  return `${data}.${signature(data)}`;
}

export function validateGateToken(token: string | undefined, userId: string, sessionId: string): boolean {
  if (!token) return false;
  const [data, mac, extra] = token.split('.');
  if (!data || !mac || extra) return false;
  const expected = Buffer.from(signature(data));
  const provided = Buffer.from(mac);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return false;
  try {
    const v: unknown = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (!v || typeof v !== 'object' || !('userId' in v) || !('sessionId' in v) || !('expires' in v)) return false;
    return v.userId === userId && v.sessionId === sessionId && typeof v.expires === 'number' && v.expires > Date.now();
  } catch { return false; }
}

export async function hasVerifiedLogin(): Promise<boolean> {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user || !user.email_confirmed_at) return false;
  const { data: { session } } = await client.auth.getSession();
  const sid = session ? getSessionId(session.access_token) : null;
  const cookie = (await cookies()).get(GATE_COOKIE)?.value;
  return !!sid && validateGateToken(cookie, user.id, sid);
}

export function requestIsSameOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  return origin === req.nextUrl.origin;
}
