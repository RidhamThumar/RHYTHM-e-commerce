import { NextRequest,NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requestIsSameOrigin } from '@/lib/auth/login';
import { needStoreUser,ShopAuthError,fetchStoreState,resolveVariant,available } from '@/lib/shop/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';

// Mutations always take a product slug, size and desired absolute quantity; never accept client prices.
export async function POST(req:NextRequest){
  if(!requestIsSameOrigin(req))return NextResponse.json({error:'Invalid origin.'},{status:403});
  try{
    const user=await needStoreUser();
    const body:unknown=await req.json();
    if(!body||typeof body!=='object')return NextResponse.json({error:'Invalid request.'},{status:400});
    const b=body as Record<string,unknown>;
    if(typeof b.id!=='string'||b.id.length>100||typeof b.size!=='string'||b.size.length>30||!Number.isSafeInteger(b.quantity)||Number(b.quantity)<0||Number(b.quantity)>10){
      return NextResponse.json({error:'Invalid item or quantity (0–10).'},{status:400});
    }
    const v=await resolveVariant(b.id,b.size);
    if(!v)return NextResponse.json({error:'Product size not available.'},{status:404});
    const quantity=Number(b.quantity);
    if(quantity>available(v))return NextResponse.json({error:`Only ${available(v)} available for this size.`},{status:409});
    await db.$transaction(async tx=>{
      const cart=await tx.cart.upsert({where:{userId:user.id},update:{},create:{userId:user.id}});
      if(!quantity){await tx.cartItem.deleteMany({where:{cartId:cart.id,variantId:v.id}});}
      else {await tx.cartItem.upsert({where:{cartId_variantId:{cartId:cart.id,variantId:v.id}},update:{quantity},create:{cartId:cart.id,variantId:v.id,quantity}});}
    });
    return NextResponse.json(await fetchStoreState(user.id),{headers:{'Cache-Control':'no-store'}});
  }catch(e){
    if(e instanceof ShopAuthError)return NextResponse.json({error:e.message},{status:401});
    return NextResponse.json({error:'Could not update bag. Please retry.'},{status:503});
  }
}
