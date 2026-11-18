'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

type Mode = 'signup' | 'login';
export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const normalized = email.trim().toLowerCase();
      if (mode === 'signup') {
        if (password.length < 8) throw new Error('Use a password of at least 8 characters.');
        const { error } = await createClient().auth.signUp({ email: normalized, password, options: { data: { full_name: name.trim() } } });
        if (error) throw error;
        router.push(`/verify-email?email=${encodeURIComponent(normalized)}&flow=signup`);
      } else {
        const response = await fetch('/api/auth/email-login/start', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalized, password }), cache: 'no-store',
        });
        const result: { error?: string } = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not begin login.');
        router.push('/login-otp');
      }
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <form className="auth-form" onSubmit={submit}>
    {mode === 'signup' && <><label htmlFor="name">FULL NAME</label><input id="name" required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"/></>}
    <label htmlFor="email">EMAIL ADDRESS</label><input id="email" required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
    <label htmlFor="password">PASSWORD</label><input id="password" required type="password" minLength={mode === 'signup' ? 8 : 1} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'}/>
    {mode === 'login' && <Link className="hint" href="/forgot-password">Forgot your password?</Link>}
    <button disabled={busy} className="button button-dark" type="submit">{busy ? 'PLEASE WAIT…' : mode === 'signup' ? 'CREATE ACCOUNT' : 'CONTINUE TO EMAIL VERIFICATION'}</button>
    {message && <p className="form-notice" role="alert">{message}</p>}
    {mode === 'signup' && <p className="auth-smallprint">If an email is already registered, Supabase may respond without revealing that fact. Existing customers should sign in.</p>}
  </form>;
}
