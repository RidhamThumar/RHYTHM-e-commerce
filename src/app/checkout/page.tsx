'use client';
import Link from 'next/link';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import {useStore} from '@/context/StoreContext';
import {formatPrice} from '@/lib/products';
type Quote={subtotalCents:number;shippingCents:number;totalCents:number;problems:{sku:string;available:number}[]};
export default function Checkout(){
 const router=useRouter();const {cart,getProduct,subtotal,hydrated,isAuthenticated,busy}=useStore();
 const [shipping,setShipping]=useState<'standard'|'express'>('standard');
 const [quote,setQuote]=useState<Quote|null>(null);const [quoteError,setQuoteError]=useState('');
 const [paymentResult,setPaymentResult]=useState<'success'|'decline'>('success');
 const [submitting,setSubmitting]=useState(false);const [status,setStatus]=useState('');
 const checkoutKey=useRef('');
 const signature=cart.map(i=>`${i.id}:${i.size}:${i.quantity}`).join('|');
 useEffect(()=>{checkoutKey.current=crypto.randomUUID();},[signature,shipping]);
 useEffect(()=>{
  if(!hydrated||!isAuthenticated||!cart.length){setQuote(null);return;}
  const controller=new AbortController();setQuote(null);setQuoteError('');
  fetch(`/api/shop/quote?shipping=${shipping}`,{cache:'no-store',signal:controller.signal})
   .then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Could not calculate quote');return d;})
   .then(d=>setQuote(d)).catch(e=>{if(!controller.signal.aborted)setQuoteError(e instanceof Error?e.message:'Quote unavailable');});
  return()=>controller.abort();
 },[hydrated,isAuthenticated,shipping,signature]);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setStatus('');if(!isAuthenticated||!quote||quote.problems.length)return;
  const data=new FormData(e.currentTarget);
  const country=String(data.get('country')||'');
  const address={recipient:`${data.get('firstName')} ${data.get('lastName')}`.trim(),line1:String(data.get('line1')),line2:String(data.get('line2')||''),city:String(data.get('city')),postalCode:String(data.get('postalCode')),countryCode:country};
  if(!checkoutKey.current)checkoutKey.current=crypto.randomUUID();
  setSubmitting(true);
  try{
   const response=await fetch('/api/checkout/sandbox',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:checkoutKey.current,shipping,result:paymentResult,address})});
   const body=await response.json();
   if(!response.ok){setStatus(body.error||'Test checkout failed');return;}
   router.push(`/order-success?order=${encodeURIComponent(body.orderNumber)}`);
  }catch{setStatus('Could not complete test checkout. Check your order history before trying again.');}
  finally{setSubmitting(false);}
 }
 const shippingFee=isAuthenticated?(quote?.shippingCents??0)/100:(shipping==='express'?25:subtotal>=150?0:12);
 const shownSubtotal=isAuthenticated?(quote?.subtotalCents??0)/100:subtotal;
 const shownTotal=isAuthenticated?(quote?.totalCents??0)/100:subtotal+shippingFee;
 if(!hydrated)return <div className="section-shell utility-page">Loading checkout...</div>;
 if(!cart.length)return <div className="section-shell utility-page"><span className="eyebrow">CHECKOUT</span><div className="empty-state"><h1>Your bag is empty.</h1><Link className="button button-dark" href="/shop">SHOP COLLECTION</Link></div></div>;
 return <div className="section-shell utility-page"><span className="eyebrow">RHYTHM / SANDBOX CHECKOUT</span><h1>Checkout.</h1>
 <p className="demo-banner">PORTFOLIO TEST MODE — No real card details, no payment gateway, and no money transfer. A successful simulation creates a test order and reduces test inventory. All prices are in USD.</p>
 {!isAuthenticated&&<p role="alert" className="form-error">Please <Link href="/login">sign in and complete email OTP</Link> to place a sandbox order. Guest checkout is not enabled in this phase.</p>}
 {quoteError&&<p role="alert" className="form-error">{quoteError}</p>}
 {isAuthenticated&&!quote&&!quoteError&&<p role="status">Checking database totals and stock…</p>}
 {!!quote?.problems.length&&<p role="alert" className="form-error">One or more sizes are out of stock. Edit your bag.</p>}
 <div className="checkout-grid"><form onSubmit={submit} className="checkout-form"><h2>Contact details</h2>
 <div className="field-grid"><label>First name<input name="firstName" required maxLength={50} autoComplete="given-name"/></label><label>Last name<input name="lastName" required maxLength={50} autoComplete="family-name"/></label></div>
 <h2>Shipping address</h2><label>Address<input name="line1" required maxLength={160} autoComplete="address-line1"/></label><label>Apartment (optional)<input name="line2" maxLength={160} autoComplete="address-line2"/></label>
 <div className="field-grid"><label>City<input name="city" required maxLength={100} autoComplete="address-level2"/></label><label>Postal code<input name="postalCode" required minLength={3} maxLength={24} autoComplete="postal-code"/></label></div>
 <label>Country<select name="country" required defaultValue=""><option value="" disabled>Select a country</option><option value="US">United States</option><option value="IN">India</option><option value="GB">United Kingdom</option><option value="NP">Nepal</option></select></label>
 <h2>Shipping method</h2><label className="shipping-choice"><input type="radio" checked={shipping==='standard'} onChange={()=>setShipping('standard')}/> Standard — {shownSubtotal>=150?'Free':'$12.00'}</label><label className="shipping-choice"><input type="radio" checked={shipping==='express'} onChange={()=>setShipping('express')}/> Express — $25.00</label>
 <h2>Sandbox payment</h2><div className="payment-placeholder"><p>No credit card or real payment details required.</p><label className="shipping-choice"><input type="radio" checked={paymentResult==='success'} onChange={()=>setPaymentResult('success')}/> Simulate successful payment</label><label className="shipping-choice"><input type="radio" checked={paymentResult==='decline'} onChange={()=>setPaymentResult('decline')}/> Simulate declined payment</label></div>
 <button type="submit" className="button button-dark" disabled={!isAuthenticated||!quote||!!quote.problems.length||submitting||busy}>{submitting?'PROCESSING TEST PAYMENT…':'PLACE SANDBOX ORDER'}</button>
 {status&&<p role="alert" className="form-error">{status}</p>}</form><aside className="order-summary"><h2>YOUR ORDER / TEST MODE</h2>
 {cart.map(i=>{const p=getProduct(i.id);return p&&<div className="checkout-item" key={`${i.id}-${i.size}`}><img src={p.image} alt=""/><span>{p.name}<small>{i.size} × {i.quantity}</small></span><strong>{formatPrice(p.price*i.quantity)}</strong></div>})}
 <div><span>SUBTOTAL</span><strong>{formatPrice(shownSubtotal)}</strong></div><div><span>SHIPPING</span><strong>{formatPrice(shippingFee)}</strong></div><div className="summary-total"><span>TEST TOTAL</span><strong>{formatPrice(shownTotal)}</strong></div><Link href="/cart">← EDIT YOUR BAG</Link></aside></div></div>;
}
