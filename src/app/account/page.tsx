import Link from 'next/link';import {redirect} from 'next/navigation';
import {createClient} from '@/lib/supabase/server';import {SignOutButton} from '@/components/SignOutButton';
import {db} from '@/lib/db';
import {hasVerifiedLogin} from '@/lib/auth/login';
import {needAdmin} from '@/lib/admin/auth';
export const dynamic='force-dynamic';
export default async function Account(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url || !key || key.includes('PASTE_YOUR')){
   return <div className="section-shell utility-page narrow-page"><span className="eyebrow">RHYTHM / SETUP REQUIRED</span><h1>Connect Supabase Auth.</h1><p>The database is separate from authentication. Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> to the project's <code>.env</code> file, then restart the Next.js development server.</p><p>Find the publishable key under Supabase Project Settings → API Keys. Never use a secret or service-role key in a public variable.</p><Link href="/">BACK TO STOREFRONT</Link></div>;
 }
 const supabase=await createClient();const {data:{user},error}=await supabase.auth.getUser();
 if(error||!user)redirect('/login');
 if(!(await hasVerifiedLogin()))redirect('/login?otp_required=1');
 // Only confirmed Auth users can be mirrored into the store's customer table.
 // Prisma's User ID is separate from the Supabase Auth user ID in this version.
 let profileSynced = true;
 if(user.email && user.email_confirmed_at){
   try{await db.user.upsert({where:{email:user.email},update:{name:typeof user.user_metadata?.full_name==='string'?user.user_metadata.full_name:undefined,emailVerifiedAt:new Date(user.email_confirmed_at)},create:{email:user.email,name:typeof user.user_metadata?.full_name==='string'?user.user_metadata.full_name:null,emailVerifiedAt:new Date(user.email_confirmed_at)}});}catch { profileSynced = false; /* Auth remains valid even if the storefront DB is temporarily unavailable. */ }
 }
 let isAdmin = false;
 try { await needAdmin(); isAdmin = true; } catch { /* Normal customer: no admin navigation. */ }
 return <div className="section-shell utility-page"><span className="eyebrow">RHYTHM / YOUR SPACE</span><h1>Your account.</h1><p>Signed in as <strong>{user.email}</strong></p>{!profileSynced&&<p role="status" className="form-notice">Your Supabase account is signed in. Storefront profile sync is temporarily unavailable; verify the database connection under /api/health/db.</p>}<div className="account-grid"><div className="account-tile"><span>01 / PROFILE</span><h2>{typeof user.user_metadata?.full_name==='string'?user.user_metadata.full_name:'Personal details'}</h2><p>Email verification: {user.email_confirmed_at?'Confirmed':'Pending'}</p></div><div className="account-tile"><span>02 / ORDERS</span><h2>Order history</h2><p><Link href="/account/orders">VIEW ORDER HISTORY ↗</Link></p></div><div className="account-tile"><span>03 / ADDRESSES</span><h2>Saved addresses</h2><p><Link href="/account/addresses">MANAGE ADDRESSES ↗</Link></p></div><div className="account-tile"><span>04 / SAVED</span><h2>Wishlist</h2><Link href="/wishlist">VIEW SAVED PIECES ↗</Link></div>{isAdmin&&<div className="account-tile"><span>05 / STORE MANAGEMENT</span><h2>Administration</h2><p>Manage products, inventory, orders and customers.</p><p><Link href="/admin">OPEN ADMIN DASHBOARD ↗</Link></p></div>}</div><div style={{marginTop:24}}><SignOutButton/></div></div>;
}
