import {NextRequest,NextResponse} from 'next/server';
import {needAdmin} from '@/lib/admin/auth';import {adminFailure,checkWrite,text,integer} from '@/lib/admin/http';import {db} from '@/lib/db';
export const runtime='nodejs';export const dynamic='force-dynamic';
const bool=(v:unknown)=>typeof v==='boolean'?v:null;
export async function POST(req:NextRequest){const issue=checkWrite(req);if(issue)return issue;try{
 await needAdmin();const x=await req.json();
 const slug=text(x.slug,90),name=text(x.name,140),description=text(x.description,3000),category=text(x.category,80),color=text(x.color,80),image=text(x.image,2000),priceCents=integer(x.priceCents,1,100000000);
 if(!slug||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||!name||!description||!category||!color||!image||!/^https:\/\//.test(image)||priceCents===null)return NextResponse.json({error:'Provide a valid slug, name, description, category, color, HTTPS image URL and price.'},{status:400});
 const p=await db.product.create({data:{slug,name,description,category,color,image,priceCents,currency:'USD',active:true,featured:false}});
 return NextResponse.json({product:p},{status:201});
}catch(e){if(e&&typeof e==='object'&&'code'in e&&e.code==='P2002')return NextResponse.json({error:'Product slug already exists.'},{status:409});return adminFailure(e)}}
export async function PATCH(req:NextRequest){const issue=checkWrite(req);if(issue)return issue;try{
 await needAdmin();const x=await req.json();const id=text(x.id,100);if(!id)return NextResponse.json({error:'Product ID required.'},{status:400});
 const data:{name?:string;description?:string;category?:string;color?:string;image?:string;priceCents?:number;active?:boolean;featured?:boolean}={};
 for(const k of ['name','description','category','color','image'] as const){if(k in x){const s=text(x[k],k==='description'?3000:k==='image'?2000:140);if(!s || (k==='image'&&!/^https:\/\//.test(s)))return NextResponse.json({error:`Invalid ${k}.`},{status:400});data[k]=s;}}
 if('priceCents'in x){const n=integer(x.priceCents,1,100000000);if(n===null)return NextResponse.json({error:'Invalid price.'},{status:400});data.priceCents=n;}
 if('active'in x){const b=bool(x.active);if(b===null)return NextResponse.json({error:'Invalid active flag.'},{status:400});data.active=b;}
 if('featured'in x){const b=bool(x.featured);if(b===null)return NextResponse.json({error:'Invalid featured flag.'},{status:400});data.featured=b;}
 if(!Object.keys(data).length)return NextResponse.json({error:'No changes supplied.'},{status:400});
 const p=await db.product.update({where:{id},data});return NextResponse.json({product:p});
}catch(e){return adminFailure(e)}}
