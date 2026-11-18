import 'server-only';
import { randomBytes } from 'node:crypto';
import { Prisma, PaymentProvider } from '@/generated/prisma/client';
import { db } from '@/lib/db';

export type SandboxRequest={key:string;shipping:'standard'|'express';result:'success'|'decline';address:{recipient:string;line1:string;line2?:string;city:string;postalCode:string;countryCode:string}};
export class CheckoutError extends Error{constructor(message:string,public status=400){super(message);}}
function isText(s:unknown,max:number){return typeof s==='string'&&s.trim().length>0&&s.trim().length<=max;}
export function parseSandboxBody(value:unknown):SandboxRequest{
  if(!value||typeof value!=='object')throw new CheckoutError('Invalid checkout request.');
  const v=value as Record<string,unknown>;
  const a=v.address as Record<string,unknown>|undefined;
  if(!a||typeof a!=='object'||!isText(a.recipient,100)||!isText(a.line1,160)||!isText(a.city,100)||!isText(a.postalCode,24)||!isText(a.countryCode,2)||!(/^[A-Z]{2}$/.test(String(a.countryCode))))throw new CheckoutError('Complete the shipping address and select a supported country.');
  if(v.shipping!=='standard'&&v.shipping!=='express')throw new CheckoutError('Invalid shipping method.');
  if(v.result!=='success'&&v.result!=='decline')throw new CheckoutError('Invalid test payment selection.');
  if(typeof v.key!=='string'||!/^[a-zA-Z0-9-]{16,100}$/.test(v.key))throw new CheckoutError('Invalid checkout reference.');
  return {key:v.key,shipping:v.shipping,result:v.result,address:{recipient:String(a.recipient).trim(),line1:String(a.line1).trim(),line2:typeof a.line2==='string'?a.line2.slice(0,160):undefined,city:String(a.city).trim(),postalCode:String(a.postalCode).trim(),countryCode:String(a.countryCode)}};
}
export async function sandboxCheckout(user:{id:string;email:string},request:SandboxRequest){
  // Key is specific to the account: a request replay from another account never reveals the original order.
  const checkoutKey=`${user.id}:${request.key}`;
  const existing=await db.order.findUnique({where:{checkoutKey}});
  if(existing)return {order:existing,alreadyProcessed:true};
  if(request.result==='decline')throw new CheckoutError('Test payment declined. No order was placed and no stock was deducted.',402);
  try{
    const order=await db.$transaction(async tx=>{
      const duplicate=await tx.order.findUnique({where:{checkoutKey}});
      if(duplicate)return duplicate;
      const cart=await tx.cart.findUnique({where:{userId:user.id},include:{items:{include:{variant:{include:{product:true}}}}}});
      const lines=cart?.items??[];
      if(!lines.length)throw new CheckoutError('Your saved bag is empty.',409);
      if(lines.length>50)throw new CheckoutError('Too many different items.',400);
      const currency=lines[0].variant.product.currency;
      if(lines.some(i=>!i.variant.product.active||i.variant.product.currency!==currency||i.quantity<1||i.quantity>10))throw new CheckoutError('One or more bag items are unavailable.',409);
      // Row-lock-equivalent conditional update: prevent overselling despite concurrent checkouts.
      for(const i of lines){
        const count=await tx.$executeRaw`UPDATE "ProductVariant" SET stock=stock-${i.quantity} WHERE id=${i.variantId} AND stock-reserved>=${i.quantity}`;
        if(count!==1)throw new CheckoutError(`${i.variant.product.name} / ${i.variant.size} has insufficient stock.`,409);
      }
      const subtotalCents=lines.reduce((n,i)=>n+i.variant.product.priceCents*i.quantity,0);
      const shippingCents=request.shipping==='express'?2500:subtotalCents>=15000?0:1200;
      const orderNumber=`RY-${randomBytes(7).toString('hex').toUpperCase()}`;
      const created=await tx.order.create({data:{checkoutKey,orderNumber,userId:user.id,email:user.email,status:'CONFIRMED',currency,subtotalCents,shippingCents,totalCents:subtotalCents+shippingCents,shippingAddress:{recipient:request.address.recipient,line1:request.address.line1,line2:request.address.line2??'',city:request.address.city,postalCode:request.address.postalCode,countryCode:request.address.countryCode},items:{create:lines.map(i=>({productId:i.variant.productId,variantId:i.variantId,sku:i.variant.sku,productName:i.variant.product.name,size:i.variant.size,quantity:i.quantity,unitPriceCents:i.variant.product.priceCents,lineTotalCents:i.variant.product.priceCents*i.quantity}))},payments:{create:{provider:PaymentProvider.DEMO,providerPaymentId:`demo-${orderNumber}`,status:'SUCCEEDED',amountCents:subtotalCents+shippingCents,currency}}}});
      await tx.cartItem.deleteMany({where:{cartId:cart!.id}});
      return created;
    },{isolationLevel:Prisma.TransactionIsolationLevel.Serializable,timeout:20000});
    return {order,alreadyProcessed:false};
  }catch(e){
    if(e instanceof CheckoutError)throw e;
    if(e instanceof Prisma.PrismaClientKnownRequestError&&(e.code==='P2002'||e.code==='P2034')){
      const order=await db.order.findUnique({where:{checkoutKey}});
      if(order)return {order,alreadyProcessed:true};
      throw new CheckoutError('The checkout changed while processing. Please retry safely.',409);
    }
    throw e;
  }
}
