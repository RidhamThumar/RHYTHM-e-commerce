import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseConfig } from './config';
export async function createClient() {
  const { url, key } = supabaseConfig();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: Parameters<typeof cookieStore.set>[2] }>) {
        try { cookiesToSet.forEach(({name,value,options}) => cookieStore.set(name,value,options)); }
        catch { /* Server Components cannot mutate cookies. Middleware refreshes tokens. */ }
      }
    }
  });
}
