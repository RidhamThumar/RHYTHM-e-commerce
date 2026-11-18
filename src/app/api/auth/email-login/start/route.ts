import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CHALLENGE_COOKIE, CHALLENGE_SECONDS, isolatedAuth, requestIsSameOrigin } from '@/lib/auth/login';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!requestIsSameOrigin(req)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || !('email' in body) || !('password' in body) || typeof body.email !== 'string' || typeof body.password !== 'string') return NextResponse.json({ error: 'Enter an email and password.' }, { status: 400 });
    const email = body.email.trim().toLowerCase();
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || body.password.length > 1024) return NextResponse.json({ error: 'Invalid credentials.' }, { status: 400 });
    const since = new Date(Date.now() - 15 * 60_000);
    const count = await db.emailLoginChallenge.count({ where: { email, createdAt: { gte: since } } });
    if (count >= 5) return NextResponse.json({ error: 'Too many login-code requests. Try again later.' }, { status: 429 });
    const auth = isolatedAuth();
    const { data, error } = await auth.auth.signInWithPassword({ email, password: body.password });
    if (error || !data.user?.email_confirmed_at) return NextResponse.json({ error: 'Invalid credentials or email not verified.' }, { status: 401 });
    // Discard isolated password session: never send its tokens to the browser.
    const { error: sendError } = await auth.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (sendError) return NextResponse.json({ error: 'Could not send an email code. Check Supabase Auth email logs and SMTP.' }, { status: 502 });
    const challenge = await db.emailLoginChallenge.create({ data: { email, expiresAt: new Date(Date.now() + CHALLENGE_SECONDS * 1000) } });
    const res = NextResponse.json({ ok: true, message: 'Check your email for the 6-digit verification code.' });
    res.cookies.set(CHALLENGE_COOKIE, challenge.id, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: CHALLENGE_SECONDS });
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch {
    return NextResponse.json({ error: 'Login is temporarily unavailable. Check database connectivity.' }, { status: 503 });
  }
}
