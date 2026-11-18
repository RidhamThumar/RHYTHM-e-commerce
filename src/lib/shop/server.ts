import 'server-only';
import { db } from '@/lib/db';
import { createClient } from '@/lib/supabase/server';
import { hasVerifiedLogin } from '@/lib/auth/login';
import type { User } from '@/generated/prisma/client';

export class ShopAuthError extends Error { constructor(){super('Sign in and complete email verification to sync your bag.');} }

// Require BOTH Supabase identity and the custom second-factor login gate on every private store operation.
export async function storeUser(): Promise<User | null> {
  const supabase=await createClient();
  const {data:{user},error}=await supabase.auth.getUser();
  if(error || !user?.email || !user.email_confirmed_at) return null;
  if(!(await hasVerifiedLogin()))return null;
  // Supabase email is verified, but email addresses can change or be reassigned.
  // Once linked, an existing store profile must only be used by the same immutable Auth user.
  const email = user.email.toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing?.supabaseAuthId && existing.supabaseAuthId !== user.id) {
    // Never silently hand an old customer's orders/role to a different Auth identity.
    throw new ShopAuthError();
  }
  const linked = await db.user.findUnique({ where: { supabaseAuthId: user.id } });
  if (linked && linked.email !== email) {
    // Email changes require an explicit audited migration of the customer record.
    throw new ShopAuthError();
  }
  const name = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : undefined;
  if (existing) {
    return db.user.update({
      where: { id: existing.id },
      data: { supabaseAuthId: user.id, emailVerifiedAt: new Date(user.email_confirmed_at), ...(name ? { name } : {}) }
    });
  }
  return db.user.create({
    data: { supabaseAuthId: user.id, email, emailVerifiedAt: new Date(user.email_confirmed_at), name: name ?? null }
  });
}
export async function needStoreUser(){const user=await storeUser();if(!user)throw new ShopAuthError();return user;}

export async function fetchStoreState(userId:string){
  const [cart,wishlist]=await Promise.all([
    db.cart.findUnique({where:{userId},include:{items:{include:{variant:{include:{product:true}}}}}}),
    db.wishlistItem.findMany({where:{userId},include:{product:true}})
  ]);
  return {
    cart:(cart?.items??[]).filter(i=>i.variant.product.active).map(i=>({id:i.variant.product.slug,size:i.variant.size,quantity:i.quantity})),
    wishlist:wishlist.filter(i=>i.product.active).map(i=>i.product.slug)
  };
}

export async function resolveVariant(slug:string,size:string) {
  return db.productVariant.findFirst({where:{size,product:{slug,active:true}},include:{product:true}});
}
export function available(variant:{stock:number;reserved:number}) {return Math.max(0,variant.stock-variant.reserved);}
