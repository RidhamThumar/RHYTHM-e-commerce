'use client';
import {useEffect} from 'react';
export default function ErrorPage({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
 useEffect(()=>{console.error('RHYTHM page failed:',error.message);},[error]);
 return <div className="section-shell utility-page"><span className="eyebrow">RHYTHM / CONNECTION ISSUE</span><h1>Something went wrong.</h1><p>We could not load the latest store information. Your account and stored items have not been deleted.</p><button className="button button-dark" onClick={reset}>TRY AGAIN</button></div>;
}
