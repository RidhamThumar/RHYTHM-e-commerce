import { Suspense } from 'react';
import VerifyEmailClient from './verify-client';
export default function VerifyEmail(){return <Suspense fallback={<div className="section-shell utility-page">Loading verification…</div>}><VerifyEmailClient/></Suspense>}
