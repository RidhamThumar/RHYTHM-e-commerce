import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
import {CHALLENGE_COOKIE,GATE_COOKIE,requestIsSameOrigin} from '@/lib/auth/login';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
  if(!requestIsSameOrigin(req)) return NextResponse.json({error:'Invalid origin'}, {status:403});
  const supabase=await createClient();
  await supabase.auth.signOut();
  const res=NextResponse.json({ok:true});
  res.cookies.set(GATE_COOKIE,'',{path:'/',maxAge:0});
  res.cookies.set(CHALLENGE_COOKIE,'',{path:'/',maxAge:0});
  return res;
}
