import 'server-only';
import { db } from './db';

// Database-backed catalog for Phase 4; the existing demo UI stays operational until wired in.
export async function getCatalogProducts() {
  return db.product.findMany({
    where: { active: true },
    include: { variants: { orderBy: { size: 'asc' } } },
    orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
  });
}

export async function getCatalogProduct(slug: string) {
  return db.product.findUnique({
    where: { slug, active: true },
    include: { variants: true },
  });
}
