import { NextRequest, NextResponse } from 'next/server';
import {db} from '@/lib/db';
import {needStoreUser,ShopAuthError,available} from '@/lib/shop/server';
export const runtime='nodejs';export const dynamic='force-dynamic';
// Server-side, authoritative cart quote. This does NOT place an order or reserve inventory.
export async function GET(req:NextRequest){
 try{
  const user=await needStoreUser();
  const shippingMode=req.nextUrl.searchParams.get('shipping')==='express'?'express':'standard';
  const cart=await db.cart.findUnique({where:{userId:user.id},include:{items:{include:{variant:{include:{product:true}}}}}});
  const rows=cart?.items??[];
  const problems=rows.filter(i=>!i.variant.product.active||i.quantity>available(i.variant)).map(i=>({sku:i.variant.sku,available:available(i.variant)}));
  const currency=rows[0]?.variant.product.currency??'USD';
  if(rows.some(i=>i.variant.product.currency!==currency))return NextResponse.json({error:'Mixed currencies are not supported.'},{status:409});
  const subtotalCents=rows.reduce((sum,i)=>sum+i.quantity*i.variant.product.priceCents,0);
  const shippingCents=shippingMode==='express'?2500:subtotalCents>=15000?0:1200;
  return NextResponse.json({items:rows.map(i=>({slug:i.variant.product.slug,size:i.variant.size,quantity:i.quantity,unitPriceCents:i.variant.product.priceCents,sku:i.variant.sku})),currency,subtotalCents,shippingCents,totalCents:subtotalCents+shippingCents,problems,paymentEnabled:false},{headers:{'Cache-Control':'no-store'}});
 }catch(e){if(e instanceof ShopAuthError)return NextResponse.json({error:e.message},{status:401});return NextResponse.json({error:'Quote unavailable.'},{status:503});}
}
