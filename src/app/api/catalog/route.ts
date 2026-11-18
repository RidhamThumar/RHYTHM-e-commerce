import { NextResponse } from 'next/server';
import { getCatalogProducts } from '@/lib/catalog-db';

export const runtime = 'nodejs';
export async function GET() {
  try {
    const items = await getCatalogProducts();
    return NextResponse.json({ products: items.map(p => ({
      id: p.id, slug: p.slug, name: p.name, category: p.category,
      description: p.description, color: p.color, currency: p.currency,
      priceCents: p.priceCents, image: p.image, secondaryImage: p.secondaryImage,
      featured: p.featured, tag: p.tag,
      variants: p.variants.map(v => ({ size: v.size, available: Math.max(0, v.stock - v.reserved) })),
    })) });
  } catch {
    return NextResponse.json({ error: 'Catalog temporarily unavailable' }, { status: 503 });
  }
}
