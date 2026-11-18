import {needAdmin} from '@/lib/admin/auth';
import {AdminConsole} from '@/components/admin/AdminConsole';
import {createClient} from '@/lib/supabase/server';
import Link from 'next/link';
export const dynamic='force-dynamic';
export default async function AdminPage(){
 try{await needAdmin();return <AdminConsole/>;}
 catch{
  const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();
  return <main className="section-shell utility-page" style={{paddingTop:95,paddingBottom:120}}><span className="eyebrow">RHYTHM / RESTRICTED</span><h1>Store administration.</h1><p style={{maxWidth:580,lineHeight:1.9,color:'#68665f'}}>Only an explicitly authorized administrator can enter this space. This page does not reveal store data.</p>{!user?<Link className="button button-dark" href="/login">SIGN IN</Link>:<Link className="button button-dark" href="/account">RETURN TO ACCOUNT</Link>}</main>;
 }
}
