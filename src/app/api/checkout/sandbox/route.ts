import {NextRequest,NextResponse} from 'next/server';
import {requestIsSameOrigin} from '@/lib/auth/login';
import {needStoreUser,ShopAuthError} from '@/lib/shop/server';
import {parseSandboxBody,sandboxCheckout,CheckoutError} from '@/lib/checkout/sandbox';
import {sendOrderNotice} from '@/lib/checkout/email';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(req:NextRequest){
 if(!requestIsSameOrigin(req))return NextResponse.json({error:'Invalid origin.'},{status:403});
 try{
  const user=await needStoreUser();
  const input=parseSandboxBody(await req.json());
  const {order,alreadyProcessed}=await sandboxCheckout(user,input);
  // An SMTP outage must never reverse an already completed sandbox order.
  if(!alreadyProcessed)await sendOrderNotice(order.id,'CONFIRMATION').catch(e=>console.error('Notification tracking error',e));
  return NextResponse.json({orderNumber:order.orderNumber,orderId:order.id,totalCents:order.totalCents,currency:order.currency,alreadyProcessed,simulation:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){
  if(e instanceof ShopAuthError)return NextResponse.json({error:e.message},{status:401});
  if(e instanceof CheckoutError)return NextResponse.json({error:e.message},{status:e.status});
  console.error('Sandbox checkout error',e);
  return NextResponse.json({error:'Test checkout unavailable. No payment was charged. Check order history before retrying.'},{status:503});
 }
}
