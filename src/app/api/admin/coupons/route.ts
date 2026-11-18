import {NextRequest,NextResponse} from 'next/server';import {DiscountType} from '@/generated/prisma/client';import {needAdmin} from '@/lib/admin/auth';import {adminFailure,checkWrite,text,integer} from '@/lib/admin/http';import {db} from '@/lib/db';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(req:NextRequest){const issue=checkWrite(req);if(issue)return issue;try{
 await needAdmin();const x=await req.json();const code=text(x.code,40)?.toUpperCase(),type=x.discountType,amount=integer(x.amount,1,10000000);
 if(!code||!/^[A-Z0-9_-]+$/.test(code)||!Object.values(DiscountType).includes(type)||amount===null||(type==='PERCENTAGE'&&amount>100))return NextResponse.json({error:'Invalid coupon data.'},{status:400});
 const coupon=await db.coupon.create({data:{code,discountType:type,amount,active:false,currency:type==='FIXED'?'USD':null}});
 return NextResponse.json({coupon,notice:'Created inactive. Coupon redemption is not wired into sandbox checkout.'},{status:201});
}catch(e){if(e&&typeof e==='object'&&'code'in e&&e.code==='P2002')return NextResponse.json({error:'Coupon already exists.'},{status:409});return adminFailure(e)}}
export async function PATCH(req:NextRequest){const issue=checkWrite(req);if(issue)return issue;try{
 await needAdmin();const x=await req.json();const id=text(x.id,100);if(!id||typeof x.active!=='boolean')return NextResponse.json({error:'Invalid coupon update.'},{status:400});
 const coupon=await db.coupon.update({where:{id},data:{active:x.active}});return NextResponse.json({coupon,notice:'Coupon status saved; checkout redemption is not implemented.'});
}catch(e){return adminFailure(e)}}
