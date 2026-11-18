'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
export default function VerifyEmailClient() {
  const params = useSearchParams(); const router = useRouter();
  const [email,setEmail] = useState(params.get('email') || '');
  const [code,setCode] = useState(''); const [busy,setBusy] = useState(false); const [message,setMessage] = useState('');
  async function verify(e:FormEvent) {
    e.preventDefault(); setBusy(true); setMessage('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ email:email.trim().toLowerCase(), token:code, type:'email' });
      if(error) throw error;
      // Signup verification establishes a Supabase session. Require password + email
      // OTP login through our server before granting RHYTHM account access.
      await supabase.auth.signOut();
      router.replace('/login?verified=1'); router.refresh();
    } catch(err) {setMessage(err instanceof Error ? err.message : 'Verification failed.');}
    finally{setBusy(false);}
  }
  async function resend() {
    setBusy(true); setMessage('');
    try {
      const {error} = await createClient().auth.resend({type:'signup',email:email.trim().toLowerCase()});
      if(error) throw error;
      setMessage('If a signup is pending, a new verification email has been requested.');
    } catch(err) {setMessage(err instanceof Error ? err.message : 'Resend failed.');}
    finally {setBusy(false);}
  }
  return <div className="section-shell utility-page narrow-page"><span className="eyebrow">RHYTHM / SIGNUP VERIFICATION</span><h1>Check your email.</h1><p>Enter the six-digit confirmation code from RHYTHM. Once verified, sign in with your password and a fresh login code.</p><form className="auth-form" onSubmit={verify}><label htmlFor="verify-email">EMAIL ADDRESS</label><input id="verify-email" required type="email" value={email} onChange={e=>setEmail(e.target.value)}/><label htmlFor="signup-otp">6-DIGIT CODE</label><input id="signup-otp" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}/><button disabled={busy} className="button button-dark">{busy?'VERIFYING…':'VERIFY EMAIL'}</button></form><button disabled={busy} className="auth-text-button" onClick={resend}>Resend signup code</button>{message&&<p role="status" className="form-notice">{message}</p>}<p className="auth-switch"><Link href="/login">BACK TO LOGIN</Link></p></div>;
}
