import {NextRequest,NextResponse} from 'next/server';
import {PaymentProvider,Prisma} from '@/generated/prisma/client';
import {db} from '@/lib/db';
import {requestIsSameOrigin} from '@/lib/auth/login';
import {needStoreUser,ShopAuthError} from '@/lib/shop/server';
import {sendOrderNotice} from '@/lib/checkout/email';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 if(!requestIsSameOrigin(req))return NextResponse.json({error:'Invalid origin.'},{status:403});
 try{
  const user=await needStoreUser();const v:unknown=await req.json();
  const id=v&&typeof v==='object'&&'orderId'in v?v.orderId:null;
  if(typeof id!=='string'||id.length>100)return NextResponse.json({error:'Invalid order.'},{status:400});
  const result=await db.$transaction(async tx=>{
   const o=await tx.order.findFirst({where:{id,userId:user.id},include:{items:true,payments:true}});
   if(!o)return 'missing';
   if(o.status==='REFUNDED')return 'already';
   if(o.status!=='CONFIRMED'||!o.payments.some(p=>p.provider===PaymentProvider.DEMO&&p.status==='SUCCEEDED'))return 'not-eligible';
   const changed=await tx.order.updateMany({where:{id:o.id,status:'CONFIRMED',userId:user.id},data:{status:'REFUNDED'}});
   if(changed.count!==1)return 'already';
   for(const i of o.items){if(i.variantId)await tx.productVariant.update({where:{id:i.variantId},data:{stock:{increment:i.quantity}}});}
   await tx.payment.updateMany({where:{orderId:o.id,provider:PaymentProvider.DEMO,status:'SUCCEEDED'},data:{status:'REFUNDED'}});
   return 'refunded';
  },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
  if(result==='missing')return NextResponse.json({error:'Order not found.'},{status:404});
  if(result==='not-eligible')return NextResponse.json({error:'Order is not eligible for a sandbox refund.'},{status:409});
  if(result==='refunded')await sendOrderNotice(id,'REFUND').catch(e=>console.error('Refund notification error',e));
  return NextResponse.json({status:result,simulation:true});
 }catch(e){if(e instanceof ShopAuthError)return NextResponse.json({error:e.message},{status:401});console.error(e);return NextResponse.json({error:'Refund simulation unavailable.'},{status:503});}
}
