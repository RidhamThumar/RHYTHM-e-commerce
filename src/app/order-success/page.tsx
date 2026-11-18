import Link from 'next/link';
export default async function OrderSuccess({searchParams}:{searchParams:Promise<{order?:string}>}){
 const {order}=await searchParams;
 return <div className="section-shell utility-page"><span className="eyebrow">RHYTHM / SANDBOX ORDER</span><div className="empty-state"><h1>Test order confirmed.</h1><p>This order was saved in your account. No real payment took place.</p><p>Reference: <strong>{typeof order==='string'?order.slice(0,60):'View order history'}</strong></p><p>Confirmation email is sent only when order SMTP is configured; check your order history for the authoritative status.</p><Link className="button button-dark" href="/account/orders">VIEW ORDER HISTORY</Link><p><Link href="/shop">CONTINUE SHOPPING</Link></p></div></div>;
}
