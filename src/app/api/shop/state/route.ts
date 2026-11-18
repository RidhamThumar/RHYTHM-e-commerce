import { NextResponse } from 'next/server';
import { storeUser,fetchStoreState } from '@/lib/shop/server';
import { catalog } from '@/lib/shop/catalog';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(){
  try {
    const [user,items]=await Promise.all([storeUser(),catalog()]);
    const state=user?await fetchStoreState(user.id):{cart:[],wishlist:[]};
    return NextResponse.json({authenticated:!!user, userId:user?.id??null,products:items,...state},{headers:{'Cache-Control':'no-store'}});
  }catch {return NextResponse.json({error:'Store database unavailable. Please try again.'},{status:503});}
}
