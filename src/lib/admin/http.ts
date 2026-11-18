import {NextRequest,NextResponse} from 'next/server';
import {AdminAuthError} from './auth';
import {ShopAuthError} from '@/lib/shop/server';
import {requestIsSameOrigin} from '@/lib/auth/login';
export function checkWrite(req:NextRequest){
 if(!requestIsSameOrigin(req)) return NextResponse.json({error:'Invalid origin.'},{status:403});
 return null;
}
export function adminFailure(error:unknown){
 if(error instanceof AdminAuthError || error instanceof ShopAuthError) return NextResponse.json({error:'Administrative access required.'},{status:403});
 console.error('Admin API failure',error);
 return NextResponse.json({error:'Unable to complete admin action.'},{status:500});
}
export function text(v:unknown,max=300){return typeof v==='string'&&v.trim().length>0&&v.trim().length<=max?v.trim():null;}
export function integer(v:unknown,min=0,max=100000000){return typeof v==='number'&&Number.isSafeInteger(v)&&v>=min&&v<=max?v:null;}
