import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 2, connectionTimeoutMillis: 5000 });
const prisma = new PrismaClient({ adapter });

// Keep each seed row as a typed tuple. Without this annotation TypeScript
// widens each destructured value to a union of every column type.
type SeedProduct = [
  slug: string,
  name: string,
  category: string,
  price: number,
  color: string,
  sizes: string[],
  image: string,
  tag: string | null,
  description: string,
  totalStock: number,
  featured: boolean,
];

const products: SeedProduct[] = [
  ['relaxed-cotton-shirt','Relaxed Cotton Shirt','Tops',89,'Ivory',['XS','S','M','L','XL'],'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=1000&auto=format&fit=crop&q=85','BESTSELLER','A relaxed silhouette in breathable cotton, made for everyday wear.',16,true],
  ['structured-wool-coat','Structured Wool Coat','Outerwear',249,'Charcoal',['S','M','L'],'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=1000&auto=format&fit=crop&q=85','NEW','Clean lines and a considered fit in a soft wool blend.',8,true],
  ['wide-leg-trouser','Wide Leg Trouser','Bottoms',119,'Sand',['XS','S','M','L'],'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1000&auto=format&fit=crop&q=85',null,'Relaxed tailoring with a fluid, modern drape.',12,true],
  ['everyday-crewneck','Everyday Crewneck','Tops',79,'Stone',['S','M','L','XL'],'https://images.unsplash.com/photo-1578681994506-b8f463449011?w=1000&auto=format&fit=crop&q=85','NEW','Soft, versatile and intentionally understated.',22,true],
  ['minimal-leather-bag','Minimal Leather Bag','Accessories',169,'Black',['One size'],'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1000&auto=format&fit=crop&q=85',null,'A pared-back daily carry with durable finishing.',5,false],
  ['relaxed-denim','Relaxed Denim','Bottoms',139,'Charcoal',['XS','S','M','L'],'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1000&auto=format&fit=crop&q=85',null,'Classic denim reworked in a contemporary relaxed fit.',10,false],
  ['organic-ribbed-tee','Organic Ribbed Tee','Tops',49,'Ivory',['XS','S','M','L','XL'],'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1000&auto=format&fit=crop&q=85',null,'An essential silhouette with a soft ribbed texture.',28,false],
  ['utility-overshirt','Utility Overshirt','Outerwear',159,'Sand',['S','M','L','XL'],'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1000&auto=format&fit=crop&q=85',null,'A useful layering piece with refined utility detailing.',14,false],
];

try {
  for (const [slug,name,category,price,color,sizes,image,tag,description,totalStock,featured] of products) {
    const p = await prisma.product.upsert({
      where:{slug},
      update:{name,category,priceCents:price*100,currency:'USD',color,image,tag,description,featured,active:true},
      create:{slug,name,category,priceCents:price*100,currency:'USD',color,image,tag,description,featured,active:true},
    });
    // Preserve admin-edited stock on reseeding: only create missing variants.
    const base = Math.floor(totalStock/sizes.length);
    const extra = totalStock%sizes.length;
    for (const [i,size] of sizes.entries()) {
      await prisma.productVariant.upsert({
        where:{productId_size:{productId:p.id,size}},
        update:{},
        create:{productId:p.id,size,sku:`RHY-${slug.toUpperCase()}-${size.toUpperCase().replaceAll(' ','')}`,stock:base+(i<extra?1:0)},
      });
    }
  }
  console.log(`Seeded ${products.length} RHYTHM products (idempotent).`);
} finally {
  await prisma.$disconnect();
}
