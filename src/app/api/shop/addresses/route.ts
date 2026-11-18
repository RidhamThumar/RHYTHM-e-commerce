import {NextRequest,NextResponse} from 'next/server';
import {db} from '@/lib/db';
import {needStoreUser,ShopAuthError} from '@/lib/shop/server';
import {requestIsSameOrigin} from '@/lib/auth/login';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){
 try{const user=await needStoreUser();const addresses=await db.address.findMany({where:{userId:user.id},orderBy:[{isDefault:'desc'},{createdAt:'desc'}]});return NextResponse.json({addresses},{headers:{'Cache-Control':'no-store'}});}
 catch(e){return NextResponse.json({error:e instanceof ShopAuthError?e.message:'Address data unavailable.'},{status:e instanceof ShopAuthError?401:503});}
}
export async function POST(req:NextRequest){
 if(!requestIsSameOrigin(req))return NextResponse.json({error:'Invalid request origin.'},{status:403});
 try{
  const user=await needStoreUser();const data:unknown=await req.json();
  if(!data||typeof data!=='object')return NextResponse.json({error:'Invalid address'},{status:400});
  const obj=data as Record<string,unknown>;
  const fields=['recipient','line1','city','postalCode','countryCode'] as const;
  if(fields.some(k=>typeof obj[k]!=='string'||!(obj[k] as string).trim()||(obj[k] as string).length>140))return NextResponse.json({error:'Complete all required address fields (max 140 characters).'},{status:400});
  const countryCode=(obj.countryCode as string).trim().toUpperCase();
  if(!/^[A-Z]{2}$/.test(countryCode))return NextResponse.json({error:'Use a two-letter country code (US, IN, etc.).'},{status:400});
  const optional=(key:string)=>typeof obj[key]==='string'?(obj[key] as string).trim().slice(0,140):null;
  const count=await db.address.count({where:{userId:user.id}});
  if(count>=10)return NextResponse.json({error:'Maximum ten saved addresses.'},{status:409});
  const created=await db.address.create({data:{userId:user.id,recipient:(obj.recipient as string).trim(),line1:(obj.line1 as string).trim(),line2:optional('line2'),city:(obj.city as string).trim(),region:optional('region'),postalCode:(obj.postalCode as string).trim(),countryCode,phone:optional('phone'),isDefault:count===0}});
  return NextResponse.json({address:created},{status:201});
 }catch(e){return NextResponse.json({error:e instanceof ShopAuthError?e.message:'Could not save address.'},{status:e instanceof ShopAuthError?401:503});}
}
export async function DELETE(req:NextRequest){
 if(!requestIsSameOrigin(req))return NextResponse.json({error:'Invalid request origin.'},{status:403});
 try{const user=await needStoreUser();const data:unknown=await req.json();if(!data||typeof data!=='object'||!('id' in data)||typeof data.id!=='string')return NextResponse.json({error:'Invalid address'},{status:400});
  await db.address.deleteMany({where:{id:data.id,userId:user.id}});return NextResponse.json({ok:true});
 }catch(e){return NextResponse.json({error:e instanceof ShopAuthError?e.message:'Could not remove address.'},{status:e instanceof ShopAuthError?401:503});}
}
