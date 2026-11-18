import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { CHALLENGE_COOKIE, isolatedAuth, requestIsSameOrigin } from '@/lib/auth/login';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(req: NextRequest) {
  if (!requestIsSameOrigin(req)) return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  const id = req.cookies.get(CHALLENGE_COOKIE)?.value;
  if (!id) return NextResponse.json({ error: 'Login challenge expired. Start again.' }, { status: 401 });
  try {
    const current = await db.emailLoginChallenge.findUnique({ where: { id } });
    if (!current || current.consumedAt || current.expiresAt < new Date() || current.attempts >= 5) return NextResponse.json({ error: 'Start a new login.' }, { status: 401 });
    if (Date.now() - current.lastSentAt.getTime() < 60_000) return NextResponse.json({ error: 'Wait at least 60 seconds before resending.' }, { status: 429 });
    const recent = await db.emailLoginChallenge.count({ where: { email: current.email, createdAt: { gte: new Date(Date.now() - 15 * 60_000) } } });
    if (recent >= 5) return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
    const { error } = await isolatedAuth().auth.signInWithOtp({ email: current.email, options: { shouldCreateUser: false } });
    if (error) return NextResponse.json({ error: 'Unable to resend code.' }, { status: 502 });
    await db.emailLoginChallenge.update({ where: { id }, data: { lastSentAt: new Date(), expiresAt: new Date(Date.now() + 300_000), attempts: 0 } });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(CHALLENGE_COOKIE, id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 300 });
    return res;
  } catch { return NextResponse.json({ error: 'Resend temporarily unavailable.' }, { status: 503 }); }
}
