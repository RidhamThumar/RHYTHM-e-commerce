'use client';
import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {usePathname} from 'next/navigation';
import {products as legacyProducts,type Product} from '@/lib/products';

export type CartItem={id:string;size:string;quantity:number};
type Store={
 cart:CartItem[];wishlist:string[];catalog:Product[];hydrated:boolean;busy:boolean;error:string;isAuthenticated:boolean;
 addToCart:(id:string,size:string)=>void;removeFromCart:(id:string,size:string)=>void;
 updateQuantity:(id:string,size:string,quantity:number)=>void;toggleWishlist:(id:string)=>void;
 cartCount:number;subtotal:number;getProduct:(id:string)=>Product|undefined;clearCart:()=>void;
};
const StoreContext=createContext<Store|null>(null);
const MAX_PER_VARIANT=10;
const slugFor=(id:string)=>legacyProducts.find(p=>p.id===id)?.slug??id;
function normalizeCart(input:unknown,products:Product[]):CartItem[]{
 if(!Array.isArray(input))return [];
 const result:CartItem[]=[];
 for(const entry of input){
  if(!entry||typeof entry.id!=='string'||typeof entry.size!=='string')continue;
  const id=slugFor(entry.id),p=products.find(x=>x.id===id);
  const available=p?.stockBySize?.[entry.size]??0;
  const quantity=Math.floor(Number(entry.quantity));
  if(!p||available<=0||!Number.isFinite(quantity)||quantity<=0)continue;
  const prev=result.find(x=>x.id===id&&x.size===entry.size);
  if(prev)prev.quantity=Math.min(MAX_PER_VARIANT,available,prev.quantity+quantity);
  else result.push({id,size:entry.size,quantity:Math.min(MAX_PER_VARIANT,available,quantity)});
 }
 return result;
}
type Remote={authenticated:boolean;userId:string|null;products:Product[];cart:CartItem[];wishlist:string[]};
async function responseJson<T>(res:Response):Promise<T>{
 const body=await res.json();
 if(!res.ok)throw new Error(typeof body.error==='string'?body.error:'Store request failed');
 return body as T;
}
export function StoreProvider({children}:{children:ReactNode}){
 const pathname=usePathname();
 const [catalog,setCatalog]=useState<Product[]>([]);
 const [cart,setCart]=useState<CartItem[]>([]);
 const [wishlist,setWishlist]=useState<string[]>([]);
 const [hydrated,setHydrated]=useState(false);
 const [busy,setBusy]=useState(false);
 const [isAuthenticated,setIsAuthenticated]=useState(false);
 const [error,setError]=useState('');
 const authenticated=useRef(false),operation=useRef(false);
 const cartRef=useRef<CartItem[]>([]),wishRef=useRef<string[]>([]);
 useEffect(()=>{cartRef.current=cart;},[cart]);
 useEffect(()=>{wishRef.current=wishlist;},[wishlist]);
 useEffect(()=>{
  let cancelled=false;
  async function load(){
   try{
    const res=await responseJson<Remote>(await fetch('/api/shop/state',{cache:'no-store'}));
    if(cancelled)return;
    setCatalog(res.products);
    if(res.authenticated&&res.userId){
     authenticated.current=true;setIsAuthenticated(true);
     const oldCart=normalizeCart(JSON.parse(localStorage.getItem('rhythm-cart')||localStorage.getItem('forme-cart')||'[]'),res.products);
     const rawWish:unknown=JSON.parse(localStorage.getItem('rhythm-wishlist')||localStorage.getItem('forme-wishlist')||'[]');
     const oldWish=Array.isArray(rawWish)?rawWish.filter((x):x is string=>typeof x==='string').map(slugFor):[];
     let state={cart:res.cart,wishlist:res.wishlist};
     if(oldCart.length||oldWish.length){
      for(const i of oldCart){
       const existing=state.cart.find(x=>x.id===i.id&&x.size===i.size)?.quantity??0;
       const n=Math.max(existing,i.quantity);
       try{state=await responseJson<typeof state>(await fetch('/api/shop/cart',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...i,quantity:n})}));}catch{throw new Error('Guest bag could not be merged. Please retry before continuing.');}
      }
      for(const id of oldWish){
       if(!state.wishlist.includes(id))state=await responseJson<typeof state>(await fetch('/api/shop/wishlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,saved:true})}));
      }
      localStorage.removeItem('rhythm-cart');localStorage.removeItem('rhythm-wishlist');
      localStorage.removeItem('forme-cart');localStorage.removeItem('forme-wishlist');
     }
     if(!cancelled){setCart(state.cart);setWishlist(state.wishlist);}
    }else{
     authenticated.current=false;setIsAuthenticated(false);
     const oldCart=JSON.parse(localStorage.getItem('rhythm-cart')||localStorage.getItem('forme-cart')||'[]');
     const rawWish:unknown=JSON.parse(localStorage.getItem('rhythm-wishlist')||localStorage.getItem('forme-wishlist')||'[]');
     setCart(normalizeCart(oldCart,res.products));
     setWishlist(Array.isArray(rawWish)?rawWish.filter((x):x is string=>typeof x==='string').map(slugFor).filter(id=>res.products.some(p=>p.id===id)):[]);
    }
    setError('');
   }catch(e){if(!cancelled){setError(e instanceof Error?e.message:'Store unavailable');setCatalog([]);}}
   finally{if(!cancelled)setHydrated(true);}
  }
  setHydrated(false);load();
  return()=>{cancelled=true;};
 },[pathname]);
 const product=(id:string)=>catalog.find(x=>x.id===id);
 const saveGuest=(next:CartItem[],nextWish?:string[])=>{
  setCart(next);localStorage.setItem('rhythm-cart',JSON.stringify(next));
  if(nextWish){setWishlist(nextWish);localStorage.setItem('rhythm-wishlist',JSON.stringify(nextWish));}
 };
 async function mutate(path:string,body:object){
  if(operation.current)return;
  operation.current=true;setBusy(true);setError('');
  try{
   const next=await responseJson<{cart:CartItem[];wishlist:string[]}>(await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));
   setCart(next.cart);setWishlist(next.wishlist);
  }catch(e){setError(e instanceof Error?e.message:'Request failed');}
  finally{setBusy(false);operation.current=false;}
 }
 const updateQuantity=(id:string,size:string,quantity:number)=>{
  if(!hydrated||busy||operation.current)return;
  const p=product(id),max=p?.stockBySize?.[size]??0;
  const n=Math.max(0,Math.min(MAX_PER_VARIANT,max,Math.floor(Number(quantity)||0)));
  if(!p||!p.sizes.includes(size)){setError('Size unavailable');return;}
  if(authenticated.current){void mutate('/api/shop/cart',{id,size,quantity:n});return;}
  const next=cartRef.current.filter(i=>i.id!==id||i.size!==size);
  if(n)next.push({id,size,quantity:n});
  saveGuest(next);
 };
 const addToCart=(id:string,size:string)=>{
  const p=product(id),max=p?.stockBySize?.[size]??0;
  const count=cartRef.current.find(i=>i.id===id&&i.size===size)?.quantity??0;
  if(max<=count||count>=MAX_PER_VARIANT){setError('Selected size is out of stock or at the quantity limit.');return;}
  updateQuantity(id,size,count+1);
 };
 const removeFromCart=(id:string,size:string)=>updateQuantity(id,size,0);
 const toggleWishlist=(id:string)=>{
  if(!hydrated||busy||operation.current||!product(id))return;
  const saved=!wishRef.current.includes(id);
  if(authenticated.current){void mutate('/api/shop/wishlist',{id,saved});return;}
  const next=saved?[...wishRef.current,id]:wishRef.current.filter(x=>x!==id);
  setWishlist(next);localStorage.setItem('rhythm-wishlist',JSON.stringify(next));
 };
 const clearCart=()=>{
  if(authenticated.current){setError('Remove items individually from your saved bag.');return;}
  saveGuest([]);
 };
 const cartCount=cart.reduce((n,i)=>n+i.quantity,0);
 const subtotal=cart.reduce((n,i)=>n+(product(i.id)?.price??0)*i.quantity,0);
 return <StoreContext.Provider value={{cart,wishlist,catalog,hydrated,busy,error,isAuthenticated,addToCart,removeFromCart,updateQuantity,toggleWishlist,cartCount,subtotal,getProduct:product,clearCart}}>
  {error&&<div role="alert" style={{padding:'10px 5%',background:'#f7e6dd',color:'#783d26',fontSize:13}}>RHYTHM: {error}</div>}{children}
 </StoreContext.Provider>;
}
export function useStore(){const ctx=useContext(StoreContext);if(!ctx)throw new Error('StoreProvider missing');return ctx;}
