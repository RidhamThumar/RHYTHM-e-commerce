import SandboxRefundButton from '@/components/SandboxRefundButton';
import Link from 'next/link';import {redirect} from 'next/navigation';
import {db} from '@/lib/db';import {storeUser} from '@/lib/shop/server';import {formatPrice} from '@/lib/products';
export const dynamic='force-dynamic';
export default async function Orders(){
 const user=await storeUser();if(!user)redirect('/login?otp_required=1');
 const orders=await db.order.findMany({where:{userId:user.id},include:{items:true},orderBy:{createdAt:'desc'},take:30});
 const notices=await db.orderNotification.findMany({where:{orderId:{in:orders.map(o=>o.id)}}});
 return <div className="section-shell utility-page"><span className="eyebrow">RHYTHM / YOUR SPACE</span><h1>Order history.</h1><p><Link href="/account">← BACK TO ACCOUNT</Link></p>{orders.length?orders.map(o=><div key={o.id} className="account-tile" style={{marginBottom:16}}><span>{o.orderNumber} / {o.status}</span><h2>{formatPrice(o.totalCents/100)}</h2><p>Payment: <strong>SIMULATED</strong> — no real charge. Email: {notices.find(n=>n.orderId===o.id&&n.event==='CONFIRMATION')?.status??'NOT_RECORDED'}</p><p>{o.createdAt.toLocaleDateString('en-US')} · {o.items.length} line items</p>{o.items.map(i=><p key={i.id}>{i.productName} / {i.size} × {i.quantity}</p>)}{o.status==='CONFIRMED'&&<SandboxRefundButton orderId={o.id}/>}</div>):<div className="empty-state"><h2>No orders yet.</h2><p>Orders will appear here after checkout payments are integrated in Phase 5. No sandbox orders have been created yet.</p><Link className="button button-dark" href="/shop">EXPLORE THE COLLECTION</Link></div>}</div>;
}
