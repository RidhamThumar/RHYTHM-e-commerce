'use client';
import {useState} from 'react';
import {useRouter} from 'next/navigation';
export default function SandboxRefundButton({orderId}:{orderId:string}){
 const router=useRouter();const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');
 async function refund(){if(!confirm('Simulate a refund? This will restock all items in this test order.'))return;setBusy(true);setMessage('');try{
  const r=await fetch('/api/checkout/refund',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({orderId})});const data=await r.json();if(!r.ok)throw new Error(data.error||'Refund failed');setMessage('Sandbox refund complete. No money was moved.');router.refresh();
 }catch(e){setMessage(e instanceof Error?e.message:'Refund failed');}finally{setBusy(false);}}
 return <div><button type="button" className="button" disabled={busy} onClick={refund}>{busy?'REFUNDING…':'SIMULATE REFUND'}</button>{message&&<p role="status">{message}</p>}</div>;
}
