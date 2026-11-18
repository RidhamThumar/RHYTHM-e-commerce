import { NextRequest,NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requestIsSameOrigin } from '@/lib/auth/login';
import {needStoreUser,ShopAuthError,fetchStoreState} from '@/lib/shop/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 if(!requestIsSameOrigin(req))return NextResponse.json({error:'Invalid origin.'},{status:403});
 try{
  const user=await needStoreUser();const body:unknown=await req.json();
  if(!body||typeof body!=='object'||!('id' in body)||!('saved' in body)||typeof body.id!=='string'||body.id.length>100||typeof body.saved!=='boolean')return NextResponse.json({error:'Invalid request.'},{status:400});
  const p=await db.product.findFirst({where:{slug:body.id,active:true},select:{id:true}});
  if(!p)return NextResponse.json({error:'Product unavailable.'},{status:404});
  if(body.saved) await db.wishlistItem.upsert({where:{userId_productId:{userId:user.id,productId:p.id}},update:{},create:{userId:user.id,productId:p.id}});
  else await db.wishlistItem.deleteMany({where:{userId:user.id,productId:p.id}});
  return NextResponse.json(await fetchStoreState(user.id),{headers:{'Cache-Control':'no-store'}});
 }catch(e){if(e instanceof ShopAuthError)return NextResponse.json({error:e.message},{status:401});return NextResponse.json({error:'Could not update wishlist.'},{status:503});}
}
