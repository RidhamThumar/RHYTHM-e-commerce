'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
export default function LoginOtp() {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const res = await fetch('/api/auth/email-login/verify', { method:'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({code}), cache:'no-store' });
      const data: {error?:string} = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not verify the code.');
      router.replace('/account'); router.refresh();
    } catch(err) {setMessage(err instanceof Error ? err.message : 'Verification failed.');}
    finally {setBusy(false);}
  }
  async function resend() {
    setBusy(true); setMessage('');
    try {
      const res = await fetch('/api/auth/email-login/resend', { method: 'POST', cache:'no-store' });
      const data: {error?:string} = await res.json();
      if (!res.ok) throw new Error(data.error || 'Resend failed.');
      setMessage('A new email code was requested.');
    } catch(err) {setMessage(err instanceof Error ? err.message : 'Could not resend.');}
    finally {setBusy(false);}
  }
  return <div className="section-shell utility-page narrow-page"><span className="eyebrow">RHYTHM / SECURE LOGIN</span><h1>Verify your login.</h1><p>After verifying your password, we sent a six-digit code to your email. Enter it within five minutes.</p><form className="auth-form" onSubmit={submit}><label htmlFor="login-otp">6-DIGIT EMAIL CODE</label><input id="login-otp" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" placeholder="000000" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/><button className="button button-dark" disabled={busy}>{busy?'VERIFYING…':'VERIFY & SIGN IN'}</button></form><button className="auth-text-button" disabled={busy} onClick={resend}>Resend code</button>{message&&<p className="form-notice" role="status">{message}</p>}<p className="auth-switch"><Link href="/login">START OVER</Link></p></div>;
}
