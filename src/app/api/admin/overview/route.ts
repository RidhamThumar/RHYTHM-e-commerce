import {NextResponse} from 'next/server';
import {needAdmin,adminStats} from '@/lib/admin/auth';
import {adminFailure} from '@/lib/admin/http';
import {db} from '@/lib/db';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(){try{
 await needAdmin();
 const [stats,products,orders,coupons,customers]=await Promise.all([
   adminStats(),
   db.product.findMany({include:{variants:{orderBy:{size:'asc'}}},orderBy:{createdAt:'desc'},take:100}),
   db.order.findMany({include:{items:true,payments:true},orderBy:{createdAt:'desc'},take:100}),
   db.coupon.findMany({orderBy:{createdAt:'desc'},take:100}),
   db.user.findMany({select:{id:true,email:true,name:true,role:true,createdAt:true,_count:{select:{orders:true}}},orderBy:{createdAt:'desc'},take:100})
 ]);
 return NextResponse.json({stats,products,orders,coupons,customers},{headers:{'Cache-Control':'no-store'}});
}catch(e){return adminFailure(e)}}
