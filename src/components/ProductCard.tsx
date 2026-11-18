'use client';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { type Product, formatPrice } from '@/lib/products';
import { useStore } from '@/context/StoreContext';
export function ProductCard({product}:{product:Product}){const {wishlist,toggleWishlist}=useStore();const saved=wishlist.includes(product.id);return <article className="product-card"><div className="product-photo"><Link href={`/product/${product.slug}`} aria-label={`View ${product.name}`}><img src={product.image} alt={product.name} loading="lazy"/></Link>{product.tag&&<span className="product-badge">{product.tag}</span>}<button onClick={()=>toggleWishlist(product.id)} className={`heart-button ${saved?'saved':''}`} aria-label={saved?'Remove from wishlist':'Add to wishlist'}><Heart size={19} fill={saved?'currentColor':'none'}/></button></div><div className="product-meta"><div><Link href={`/product/${product.slug}`}>{product.name}</Link><p>{product.category} · {product.color}</p></div><strong>{formatPrice(product.price)}</strong></div></article>}
