import 'server-only';
import nodemailer from 'nodemailer';
import { db } from '@/lib/db';
import { orderConfirmationEmail, refundConfirmationEmail } from './email-templates';

type NoticeEvent = 'CONFIRMATION' | 'REFUND';
// Sending runs after the committed transaction, never before payment success.
// If the SMTP sender is not configured, an accurate NOT_CONFIGURED record is kept.
export async function sendOrderNotice(orderId: string, event: NoticeEvent) {
  const order = await db.order.findUnique({where:{id:orderId},include:{items:true}});
  if (!order) return;
  const existing=await db.orderNotification.findUnique({where:{orderId_event:{orderId,event}}});
  if(existing?.status==='SENT') return;
  const sender=process.env.ORDER_SMTP_FROM;
  const pass=process.env.ORDER_SMTP_APP_PASSWORD;
  const ready=!!sender && !!pass;
  const notice=await db.orderNotification.upsert({
    where:{orderId_event:{orderId,event}},
    create:{orderId,event,status:ready?'PENDING':'NOT_CONFIGURED'},
    update:{status:ready?'PENDING':'NOT_CONFIGURED',errorMessage:null}
  });
  if (!ready) return;
  const email = event === 'REFUND'
    ? refundConfirmationEmail(order, process.env.NEXT_PUBLIC_SITE_URL)
    : orderConfirmationEmail(order, process.env.NEXT_PUBLIC_SITE_URL);
  try{
    const transport=nodemailer.createTransport({host:'smtp.gmail.com',port:465,secure:true,auth:{user:sender,pass}});
    await transport.sendMail({from:`RHYTHM <${sender}>`,to:order.email,subject:email.subject,html:email.html,text:email.text});
    await db.orderNotification.update({where:{id:notice.id},data:{status:'SENT',sentAt:new Date()}});
  }catch(err){
    console.error('Transactional email delivery failed',err instanceof Error?err.message:'Unknown SMTP error');
    await db.orderNotification.update({where:{id:notice.id},data:{status:'FAILED',errorMessage:'SMTP delivery failed; check server logs.'}});
  }
}
