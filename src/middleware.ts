import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || key.includes('PASTE_YOUR')) return NextResponse.next({request});
  let response = NextResponse.next({request});
  const supabase = createServerClient(url,key,{
    cookies: {
      getAll(){return request.cookies.getAll();},
      setAll(toSet: Array<{ name: string; value: string; options?: Parameters<typeof response.cookies.set>[2] }>){
        toSet.forEach(({name,value})=>request.cookies.set(name,value));
        response = NextResponse.next({request});
        toSet.forEach(({name,value,options})=>response.cookies.set(name,value,options));
      }
    }
  });
  // Validate against Auth server, not untrusted client storage.
  await supabase.auth.getUser();
  return response;
}
export const config = { matcher: ['/account/:path*','/login','/signup','/verify-email','/update-password','/auth/callback'] };
