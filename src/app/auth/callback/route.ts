import {NextRequest,NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
export async function GET(request:NextRequest){
  const url=new URL(request.url);
  const code=url.searchParams.get('code');
  const nextParam=url.searchParams.get('next')||'/account';
  const next=nextParam.startsWith('/') && !nextParam.startsWith('//') && !nextParam.includes('\\') && !nextParam.includes('\r') && !nextParam.includes('\n')?nextParam:'/account';
  if(code){const supabase=await createClient();const {error}=await supabase.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(next,url.origin));}
  return NextResponse.redirect(new URL('/login?auth_error=confirmation',url.origin));
}
