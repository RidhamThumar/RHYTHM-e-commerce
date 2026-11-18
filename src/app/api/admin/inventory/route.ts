import {NextRequest,NextResponse} from 'next/server';import {needAdmin} from '@/lib/admin/auth';import {adminFailure,checkWrite,text,integer} from '@/lib/admin/http';import {db} from '@/lib/db';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function POST(req:NextRequest){const issue=checkWrite(req);if(issue)return issue;try{
 await needAdmin();const x=await req.json();const productId=text(x.productId,100),size=text(x.size,20),sku=text(x.sku,100),stock=integer(x.stock,0,1000000);
 if(!productId||!size||!sku||stock===null)return NextResponse.json({error:'Product, size, SKU, and stock required.'},{status:400});
 const item=await db.productVariant.create({data:{productId,size,sku,stock}});return NextResponse.json({variant:item},{status:201});
}catch(e){return adminFailure(e)}}
export async function PATCH(req:NextRequest){const issue=checkWrite(req);if(issue)return issue;try{
 await needAdmin();const x=await req.json();const id=text(x.id,100),stock=integer(x.stock,0,1000000);if(!id||stock===null)return NextResponse.json({error:'Invalid variant or stock.'},{status:400});
 const item=await db.$transaction(async tx=>{const v=await tx.productVariant.findUnique({where:{id}});if(!v) return null;if(stock<v.reserved)throw new Error('Stock must cover reserved quantity.');return tx.productVariant.update({where:{id},data:{stock}});});
 if(!item)return NextResponse.json({error:'Variant not found.'},{status:404});return NextResponse.json({variant:item});
}catch(e){if(e instanceof Error&&e.message==='Stock must cover reserved quantity.')return NextResponse.json({error:e.message},{status:409});return adminFailure(e)}}
