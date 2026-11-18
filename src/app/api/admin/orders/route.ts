import {NextRequest,NextResponse} from 'next/server';import {Prisma,OrderStatus,PaymentProvider} from '@/generated/prisma/client';import {db} from '@/lib/db';import {needAdmin} from '@/lib/admin/auth';import {adminFailure,checkWrite,text} from '@/lib/admin/http';
export const runtime='nodejs';export const dynamic='force-dynamic';
const transitions:Partial<Record<OrderStatus,OrderStatus[]>>={
 CONFIRMED:['FULFILLED','CANCELLED'],FULFILLED:['SHIPPED','CANCELLED'],SHIPPED:['DELIVERED']
};
export async function PATCH(req:NextRequest){const issue=checkWrite(req);if(issue)return issue;try{
 await needAdmin();const x=await req.json();const id=text(x.id,100),to=x.status;
 if(!id||typeof to!=='string'||!Object.values(OrderStatus).includes(to as OrderStatus))return NextResponse.json({error:'Invalid order/status.'},{status:400});
 const result=await db.$transaction(async tx=>{
  const o=await tx.order.findUnique({where:{id},include:{items:true,payments:true}});
  if(!o)return {error:'Order not found.',status:404};
  if(!transitions[o.status]?.includes(to as OrderStatus))return {error:'Invalid status transition.',status:409};
  if(!o.payments.some(p=>p.provider===PaymentProvider.DEMO&&p.status==='SUCCEEDED'))return {error:'Only successful sandbox payments can be fulfilled.',status:409};
  // Sandbox cancellation is only administrative status, not a refund. Prevent customer confusion.
  if(to==='CANCELLED')return {error:'Cancel via the existing refund workflow; cancellation is not automatically refunded.',status:409};
  const changed=await tx.order.updateMany({where:{id,status:o.status},data:{status:to as OrderStatus}});
  if(changed.count!==1)return {error:'Order changed. Refresh and retry.',status:409};
  return {status:200,orderId:id,newStatus:to};
 },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable});
 if('error'in result)return NextResponse.json({error:result.error},{status:result.status});
 return NextResponse.json({orderId:result.orderId,status:result.newStatus,note:'Sandbox fulfillment status only; no real parcel ships and no shipping email is sent.'});
}catch(e){return adminFailure(e)}}
