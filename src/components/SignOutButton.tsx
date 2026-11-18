'use client';
import {useRouter} from 'next/navigation';
import {useState} from 'react';
import {createClient} from '@/lib/supabase/browser';
export function SignOutButton(){
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const router=useRouter();
  async function signOut(){
    setBusy(true);setMessage('');
    try{
      const r=await fetch('/api/auth/logout',{method:'POST',cache:'no-store'});
      if(!r.ok)throw new Error('Could not complete logout.');
      await createClient().auth.signOut();
      router.replace('/login');router.refresh();
    }catch(err){setMessage(err instanceof Error?err.message:'Unable to sign out.');}
    finally{setBusy(false);}
  }
  return <div><button type="button" disabled={busy} className="button button-dark" onClick={signOut}>{busy?'SIGNING OUT…':'SIGN OUT'}</button>{message&&<p className="form-notice" role="alert">{message}</p>}</div>;
}
