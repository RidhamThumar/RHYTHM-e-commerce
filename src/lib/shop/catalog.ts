import 'server-only';
import { db } from '@/lib/db';
import type { Product } from '@/lib/products';

const categories = new Set(['Tops','Outerwear','Bottoms','Accessories']);
export function mapCatalogProduct(p: {
  slug:string; name:string; category:string; priceCents:number; color:string;
  image:string; secondaryImage:string|null; tag:string|null; description:string;
  featured:boolean; variants:{size:string; stock:number; reserved:number}[]
}): Product {
  const availability = Object.fromEntries(p.variants.map(v => [v.size,Math.max(0,v.stock-v.reserved)]));
  return {
    id:p.slug, slug:p.slug, name:p.name,
    category:(categories.has(p.category)?p.category:'Accessories') as Product['category'],
    price:p.priceCents/100, color:p.color, sizes:p.variants.map(v=>v.size),
    image:p.image, secondaryImage:p.secondaryImage??undefined, tag:p.tag??undefined,
    description:p.description, featured:p.featured,
    stock:Object.values(availability).reduce((n,v)=>n+v,0), stockBySize:availability
  };
}
export async function catalog() {
  const rows=await db.product.findMany({where:{active:true},include:{variants:true},orderBy:[{featured:'desc'},{createdAt:'desc'}]});
  return rows.map(mapCatalogProduct);
}
export async function catalogOne(slug:string) {
  const p=await db.product.findFirst({where:{slug,active:true},include:{variants:true}});
  return p?mapCatalogProduct(p):null;
}
