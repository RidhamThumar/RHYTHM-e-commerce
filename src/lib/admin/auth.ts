import 'server-only';
import {needStoreUser} from '@/lib/shop/server';
import {db} from '@/lib/db';
export class AdminAuthError extends Error { constructor(){super('Administrative access required.')} }
export async function needAdmin(){
  const user=await needStoreUser();
  // Both allowlist and DB role are required. Do not infer privilege from public signup metadata.
  const allow=(process.env.ADMIN_EMAILS??'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
  if(!allow.includes(user.email.toLowerCase()) || user.role!=='ADMIN') throw new AdminAuthError();
  return user;
}
export async function adminStats(){
 const [products, customers, orders, payments, coupons, lowStock]=await Promise.all([
  db.product.count(),db.user.count(),db.order.count(),db.payment.count({where:{provider:'DEMO',status:'SUCCEEDED'}}),db.coupon.count(),
  db.productVariant.count({where:{stock:{lte:5},product:{active:true}}})
 ]);
 const completed=await db.order.aggregate({where:{status:{in:['CONFIRMED','FULFILLED','SHIPPED','DELIVERED']}},_sum:{totalCents:true},_count:true});
 const refunded=await db.order.aggregate({where:{status:'REFUNDED'},_sum:{totalCents:true},_count:true});
 return {products,customers,orders,payments,coupons,lowStock,sandboxRevenueCents:completed._sum.totalCents??0,refundCents:refunded._sum.totalCents??0,completedOrders:completed._count};
}
