import {notFound} from 'next/navigation';
import type {Metadata} from 'next';
import {catalog,catalogOne} from '@/lib/shop/catalog';
import {ProductDetail} from '@/components/ProductDetail';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;const p=await catalogOne(slug);return {title:p?.name??'Product'};
}
export default async function Page({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;
 const p=await catalogOne(slug);if(!p)notFound();
 const related=await catalog();
 return <ProductDetail product={p} related={related}/>;
}
