/** Transactional HTML emails for the RHYTHM sandbox store.
 * Only pass trusted order snapshots; all interpolated text is HTML-escaped.
 * Keep marketing claims and delivery promises out of test-order messaging.
 */
export type EmailLineItem = { productName: string; size: string; quantity: number; unitPriceCents: number; lineTotalCents: number };
export type EmailOrder = {
  orderNumber: string; currency: string; subtotalCents: number; discountCents: number;
  shippingCents: number; taxCents: number; totalCents: number;
  items: EmailLineItem[];
};
export type TemplateResult = { subject: string; html: string; text: string };

const esc = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch] ?? ch));
const fmt = (cents: number, currency: string) => {
  try { return new Intl.NumberFormat('en-US', { style:'currency', currency }).format(cents / 100); }
  catch { return `${currency} ${(cents / 100).toFixed(2)}`; }
};
const safeOrderHref = (base?: string) => {
  if (!base) return undefined;
  try { const u = new URL(base); if (!['https:', 'http:'].includes(u.protocol)) return undefined; return `${u.origin}/account/orders`; }
  catch { return undefined; }
};
const frame = (content: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RHYTHM</title></head>
<body style="margin:0;padding:0;background:#f1eee9;color:#242321;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;font-size:1px;line-height:1px;color:#f1eee9;max-height:0;max-width:0;opacity:0;overflow:hidden">RHYTHM modern essentials — sandbox notification.</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1eee9"><tr><td align="center" style="padding:32px 14px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background:#ffffff">
<tr><td align="center" style="padding:40px 22px 30px;border-bottom:1px solid #e6e2dc"><div style="font-size:28px;letter-spacing:9px;color:#1c1c1a;font-weight:500">RHYTHM</div><div style="font-size:10px;letter-spacing:2.5px;margin-top:10px;color:#888079">MODERN ESSENTIALS</div></td></tr>
<tr><td style="padding:36px 34px">${content}</td></tr>
<tr><td align="center" style="border-top:1px solid #e6e2dc;padding:25px 24px 30px;color:#807a73;font-size:12px;line-height:1.8">RHYTHM · Modern Essentials<br/>This message relates to a fictional portfolio storefront. Please do not reply with payment details.</td></tr>
</table></td></tr></table></body></html>`;
const meta = (title:string,subtitle:string) => `<div style="font-size:11px;letter-spacing:2px;color:#817a72;font-weight:bold;margin-bottom:12px">${esc(title)}</div><h1 style="font-family:Georgia,serif;font-size:32px;font-weight:normal;line-height:1.2;margin:0 0 16px;color:#262521">${esc(subtitle)}</h1>`;
const notice = `<div style="background:#f6f3ee;padding:17px 19px;margin:24px 0;color:#48453f;font-size:13px;line-height:1.65"><strong>Sandbox demonstration</strong><br/>This is a test order. No real payment was processed, and no products will be shipped.</div>`;
const hr = `<div style="border-top:1px solid #e6e2dc;margin:24px 0"></div>`;
const detail = (label:string,value:string) => `<tr><td style="color:#827d76;font-size:13px;padding:7px 0">${esc(label)}</td><td align="right" style="font-size:13px;padding:7px 0;color:#242321">${esc(value)}</td></tr>`;
const orderContents = (order:EmailOrder) => {
 const lines = order.items.map(i => `<tr><td style="padding:15px 0;border-bottom:1px solid #ece9e4"><strong style="font-size:14px">${esc(i.productName)}</strong><div style="color:#827d76;font-size:12px;margin-top:5px">Size ${esc(i.size)} · Qty ${i.quantity}</div></td><td align="right" style="padding:15px 0;border-bottom:1px solid #ece9e4;font-size:14px;white-space:nowrap">${esc(fmt(i.lineTotalCents,order.currency))}</td></tr>`).join('');
 return `<div style="font-size:12px;color:#807a73;letter-spacing:1px">ORDER ${esc(order.orderNumber)}</div>${hr}<div style="font-size:17px;font-weight:bold;margin-bottom:8px">Your pieces</div><table role="presentation" cellpadding="0" cellspacing="0" width="100%">${lines}</table><table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:22px">${detail('Subtotal',fmt(order.subtotalCents,order.currency))}${order.discountCents?detail('Discount',`−${fmt(order.discountCents,order.currency)}`):''}${detail('Shipping',order.shippingCents===0?'Complimentary':fmt(order.shippingCents,order.currency))}${order.taxCents?detail('Tax',fmt(order.taxCents,order.currency)):''}<tr><td style="border-top:1px solid #e6e2dc;padding-top:16px;font-weight:bold">Test total</td><td align="right" style="border-top:1px solid #e6e2dc;padding-top:16px;font-weight:bold">${esc(fmt(order.totalCents,order.currency))}</td></tr></table>`;
};
const button = (href?:string) => href?`<div style="text-align:center;margin-top:28px"><a href="${esc(href)}" style="display:inline-block;background:#242321;color:#fff;text-decoration:none;font-size:12px;font-weight:bold;letter-spacing:1px;padding:17px 26px">VIEW YOUR ORDER</a></div>`:'';
export function orderConfirmationEmail(order:EmailOrder, siteUrl?:string):TemplateResult {
 const subject=`RHYTHM | Your sandbox order ${order.orderNumber} is confirmed`;
 const text=`RHYTHM — SANDBOX ORDER CONFIRMATION\nThank you for exploring RHYTHM. Your test order ${order.orderNumber} was recorded. No real payment was processed and nothing will ship.\n\n${order.items.map(i=>`${i.productName} · Size ${i.size} · Qty ${i.quantity} · ${fmt(i.lineTotalCents,order.currency)}`).join('\n')}\n\nSubtotal: ${fmt(order.subtotalCents,order.currency)}\nShipping: ${fmt(order.shippingCents,order.currency)}\nTest total: ${fmt(order.totalCents,order.currency)}\n${safeOrderHref(siteUrl)?`View your order: ${safeOrderHref(siteUrl)}`:''}\n\nRHYTHM · Modern Essentials`;
 const html=frame(`${meta('ORDER CONFIRMATION','Thank you for your order.')}<p style="font-size:15px;line-height:1.8;color:#5f5a53;margin:0">Your selection has been recorded successfully. Here is a summary of your RHYTHM test order.</p>${notice}${orderContents(order)}${button(safeOrderHref(siteUrl))}`);
 return {subject,html,text};
}
export function refundConfirmationEmail(order:EmailOrder, siteUrl?:string):TemplateResult {
 const subject=`RHYTHM | Sandbox refund confirmed — ${order.orderNumber}`;
 const text=`RHYTHM — SANDBOX REFUND\nYour simulated refund for order ${order.orderNumber} has been recorded. Test amount: ${fmt(order.totalCents,order.currency)}. No real funds moved, and no credit will appear on any card or bank statement.\n${safeOrderHref(siteUrl)?`View your order: ${safeOrderHref(siteUrl)}`:''}\n\nRHYTHM · Modern Essentials`;
 const html=frame(`${meta('REFUND CONFIRMATION','Your refund is recorded.')}<p style="font-size:15px;line-height:1.8;color:#5f5a53">The simulated refund for your RHYTHM order has been completed.</p>${notice}<div style="font-size:12px;color:#807a73;letter-spacing:1px">ORDER ${esc(order.orderNumber)}</div>${hr}<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${detail('Simulated refund',fmt(order.totalCents,order.currency))}${detail('Refund status','Completed in sandbox')}</table><p style="color:#5f5a53;font-size:13px;line-height:1.7;margin-top:24px">No refund will appear on a bank statement because this order involved no real charge.</p>${button(safeOrderHref(siteUrl))}`);
 return {subject,html,text};
}


/** PREPARED ONLY: these templates are not sent until corresponding authenticated,
 * verified business events are implemented. Never trigger from browser inputs alone. */
export function sandboxCancellationEmail(order: EmailOrder, siteUrl?: string): TemplateResult {
  const subject = `RHYTHM | Test order cancelled — ${order.orderNumber}`;
  const text = `RHYTHM — SANDBOX CANCELLATION\nTest order ${order.orderNumber} was cancelled. No real payment was processed, no merchandise will ship, and no real refund will occur.\n${safeOrderHref(siteUrl) ?? ''}`;
  const html = frame(`${meta('ORDER CANCELLATION', 'Your test order was cancelled.')}<p style="font-size:15px;line-height:1.8;color:#5f5a53">Your RHYTHM sandbox order has been cancelled.</p>${notice}${orderContents(order)}${button(safeOrderHref(siteUrl))}`);
  return {subject, text, html};
}
export function sandboxPaymentFailureEmail(orderReference: string): TemplateResult {
  const subject = 'RHYTHM | Test checkout was not completed';
  const text = `RHYTHM — SANDBOX CHECKOUT\nYour test checkout (${orderReference}) was declined. No charge occurred and no paid order was created. You may try again on the website. Never send payment details by email.`;
  const html = frame(`${meta('PAYMENT NOT COMPLETED', 'Your checkout did not go through.')}<p style="font-size:15px;line-height:1.8;color:#5f5a53">Your simulated payment was declined. No paid order was created.</p><div style="font-size:12px;letter-spacing:1px;color:#817a72;margin-top:22px">REFERENCE ${esc(orderReference)}</div>${notice}<p style="font-size:13px;color:#817a72;line-height:1.7">Please return to your bag if you would like to try another test checkout. Do not email card details.</p>`);
  return {subject, text, html};
}
export function shippingUpdateEmail(order:EmailOrder, tracking?:{carrier:string;trackingNumber:string}, siteUrl?:string):TemplateResult {
  // PREPARED ONLY. Invoke only after a real fulfillment event is verified.
  const subject = `RHYTHM | Shipment update — ${order.orderNumber}`;
  const info = tracking ? `Carrier: ${tracking.carrier}\nTracking: ${tracking.trackingNumber}` : 'A fulfillment update is available in your account.';
  const text = `RHYTHM — SHIPPING UPDATE\nOrder ${order.orderNumber}\n${info}\n${safeOrderHref(siteUrl)??''}`;
  const trackingHtml = tracking ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%">${detail('Carrier',tracking.carrier)}${detail('Tracking number',tracking.trackingNumber)}</table>` : '<p style="font-size:13px;color:#5f5a53">Review the latest fulfillment status in your account.</p>';
  const html = frame(`${meta('SHIPPING UPDATE', 'A new chapter in your order.')}<p style="font-size:15px;line-height:1.8;color:#5f5a53">There is a verified shipping update for order ${esc(order.orderNumber)}.</p>${trackingHtml}${button(safeOrderHref(siteUrl))}`);
  return {subject, text, html};
}
export function deliveryConfirmationEmail(order:EmailOrder, siteUrl?:string):TemplateResult {
  // PREPARED ONLY. Never send without confirmed delivery evidence.
  const subject = `RHYTHM | Delivery confirmed — ${order.orderNumber}`;
  const text = `RHYTHM — DELIVERY CONFIRMATION\nDelivery was confirmed for order ${order.orderNumber}.\n${safeOrderHref(siteUrl)??''}`;
  const html = frame(`${meta('DELIVERY CONFIRMED', 'Your pieces have arrived.')}<p style="font-size:15px;line-height:1.8;color:#5f5a53">Delivery has been confirmed for your RHYTHM order.</p>${orderContents(order)}${button(safeOrderHref(siteUrl))}`);
  return {subject, text, html};
}
