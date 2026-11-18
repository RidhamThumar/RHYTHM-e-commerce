import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CHALLENGE_COOKIE, GATE_COOKIE, createGateToken, getSessionId, isolatedAuth, requestIsSameOrigin } from '@/lib/auth/login';
import { createClient } from '@/lib/supabase/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  if (!requestIsSameOrigin(req)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const id = req.cookies.get(CHALLENGE_COOKIE)?.value;
  if (!id) return NextResponse.json({ error: 'Login challenge expired. Start again.' }, { status: 401 });
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || !('code' in body) || typeof body.code !== 'string' || !/^\d{6}$/.test(body.code)) return NextResponse.json({ error: 'Enter a six-digit code.' }, { status: 400 });
    const challenge = await db.emailLoginChallenge.findUnique({ where: { id } });
    if (!challenge || challenge.consumedAt || challenge.expiresAt <= new Date() || challenge.attempts >= 5) return NextResponse.json({ error: 'Code expired or too many attempts. Start again.' }, { status: 401 });
    // Atomically reserve an attempt before asking Supabase to validate the email code.
    const attempt = await db.emailLoginChallenge.updateMany({ where: { id, consumedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: 5 } }, data: { attempts: { increment: 1 } } });
    if (!attempt.count) return NextResponse.json({ error: 'Too many attempts.' }, { status: 429 });
    const { data, error } = await isolatedAuth().auth.verifyOtp({ email: challenge.email, token: body.code, type: 'email' });
    if (error || !data.session || !data.user || data.user.email?.toLowerCase() !== challenge.email) return NextResponse.json({ error: 'Incorrect or expired verification code.' }, { status: 401 });
    const sid = getSessionId(data.session.access_token);
    if (!sid) return NextResponse.json({ error: 'Could not validate login session.' }, { status: 500 });
    // Single-use DB challenge; a second verifier cannot reuse it.
    const consume = await db.emailLoginChallenge.updateMany({ where: { id, consumedAt: null }, data: { consumedAt: new Date() } });
    if (!consume.count) return NextResponse.json({ error: 'Code has already been used.' }, { status: 401 });
    const supabase = await createClient();
    const { error: sessionError } = await supabase.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
    if (sessionError) return NextResponse.json({ error: 'Could not establish login session.' }, { status: 500 });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(GATE_COOKIE, createGateToken(data.user.id, sid), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 12 * 60 * 60 });
    res.cookies.set(CHALLENGE_COOKIE, '', { path: '/', maxAge: 0 });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch {
    return NextResponse.json({ error: 'Verification temporarily unavailable. Please retry.' }, { status: 503 });
  }
}
