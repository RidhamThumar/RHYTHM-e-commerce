'use client';
import {useMemo,useState,useEffect,Suspense} from 'react';
import {useSearchParams,useRouter} from 'next/navigation';
import {SlidersHorizontal,X,Search} from 'lucide-react';
import {ProductCard} from './ProductCard';
import {useStore} from '@/context/StoreContext';
const categories=['Tops','Outerwear','Bottoms','Accessories'];
const colors=['Ivory','Sand','Stone','Charcoal','Black'];
const sizes=['XS','S','M','L','XL','One size'];

function ShopContents(){
 const {catalog:products,hydrated,error}=useStore();
 const MAX_PRICE=Math.max(10,Math.ceil(Math.max(0,...products.map(p=>p.price))/10)*10);
 const params=useSearchParams(),router=useRouter();
 const urlCategory=params.get('category')||'';
 const urlQuery=params.get('q')||'';
 const [category,setCategory]=useState(categories.includes(urlCategory)?urlCategory:'');
 const [query,setQuery]=useState(urlQuery);
 const [color,setColor]=useState('');const [size,setSize]=useState('');const [availability,setAvailability]=useState(false);
 const [maxPrice,setMaxPrice]=useState(0);
 useEffect(()=>{setMaxPrice(v=>v===0?MAX_PRICE:v);},[MAX_PRICE]);
 const [sort,setSort]=useState('featured');const [showFilters,setShowFilters]=useState(params.has('search'));
 useEffect(()=>{setCategory(categories.includes(urlCategory)?urlCategory:'');setQuery(urlQuery);},[urlCategory,urlQuery]);
 const reset=()=>{setCategory('');setColor('');setSize('');setMaxPrice(MAX_PRICE);setAvailability(false);setQuery('');router.replace('/shop',{scroll:false});};
 const filtered=useMemo(()=>{
  const result=products.filter(p=>(!category||p.category===category)&&(!color||p.color===color)&&(!size||(p.stockBySize?.[size]??0)>0)&&(!availability||p.stock>0)&&p.price<=(maxPrice||MAX_PRICE)&&`${p.name} ${p.color} ${p.category} ${p.description}`.toLowerCase().includes(query.trim().toLowerCase()));
  if(sort==='price-low')result.sort((a,b)=>a.price-b.price);
  if(sort==='price-high')result.sort((a,b)=>b.price-a.price);
  if(sort==='newest')result.sort((a,b)=>Number(b.tag==='NEW')-Number(a.tag==='NEW'));
  if(sort==='name')result.sort((a,b)=>a.name.localeCompare(b.name));
  return result;
 },[category,color,size,maxPrice,sort,query,availability]);
 const chips=[{key:'category',value:category,clear:()=>setCategory('')},{key:'color',value:color,clear:()=>setColor('')},{key:'size',value:size,clear:()=>setSize('')},{key:'price',value:maxPrice<MAX_PRICE?`Under $${maxPrice}`:'',clear:()=>setMaxPrice(MAX_PRICE)},{key:'stock',value:availability?'In stock':'',clear:()=>setAvailability(false)},{key:'search',value:query?`Search: ${query}`:'',clear:()=>setQuery('')}].filter(x=>x.value);
 return <div className="shop-page section-shell"><div className="shop-intro"><span className="eyebrow">THE RHYTHM COLLECTION</span><h1>Everyday, <em>elevated.</em></h1><p>Considered essentials for finding your own rhythm.</p></div>
 <div className="shop-toolbar"><button className="filter-toggle" aria-expanded={showFilters} aria-controls="catalog-filters" onClick={()=>setShowFilters(v=>!v)}><SlidersHorizontal size={17}/> FILTERS {showFilters?'−':'+'}</button><div className="toolbar-end"><span aria-live="polite">{filtered.length} PIECES</span><select aria-label="Sort products" value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">FEATURED</option><option value="price-low">PRICE: LOW TO HIGH</option><option value="price-high">PRICE: HIGH TO LOW</option><option value="newest">NEWEST</option><option value="name">NAME: A–Z</option></select></div></div>
 <div className={`shop-content ${showFilters?'filters-open':''}`}><aside id="catalog-filters" className="filters"><div className="filters-heading"><strong>FILTER BY</strong><button onClick={reset}>CLEAR ALL</button></div><label className="filter-label" htmlFor="shop-search">SEARCH</label><div className="search-input-wrap"><Search size={16}/><input id="shop-search" className="filter-search" placeholder="Search pieces..." value={query} onChange={e=>setQuery(e.target.value)}/></div><label className="filter-label" htmlFor="category">CATEGORY</label><select id="category" value={category} onChange={e=>setCategory(e.target.value)}><option value="">All categories</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select><label className="filter-label" htmlFor="color">COLOR</label><select id="color" value={color} onChange={e=>setColor(e.target.value)}><option value="">All colors</option>{colors.map(c=><option key={c} value={c}>{c}</option>)}</select><label className="filter-label" htmlFor="size">SIZE</label><select id="size" value={size} onChange={e=>setSize(e.target.value)}><option value="">All sizes</option>{sizes.map(s=><option key={s} value={s}>{s}</option>)}</select><label className="filter-label" htmlFor="price">MAX PRICE — ${maxPrice}</label><input id="price" type="range" min="0" max={MAX_PRICE} step="10" value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))}/><label className="checkbox-label"><input type="checkbox" checked={availability} onChange={e=>setAvailability(e.target.checked)}/> In stock only</label></aside><div><div className="active-filters">{chips.map(f=><span key={f.key}>{f.value}<button aria-label={`Remove ${f.key} filter`} onClick={f.clear}><X size={12}/></button></span>)}{chips.length>1&&<button className="clear-all-chip" onClick={reset}>Clear all</button>}</div>{!hydrated?<div role="status" className="empty-state">Loading collection...</div>:error?<div role="alert" className="empty-state">Catalog unavailable. Please retry.</div>:filtered.length?<div className="product-grid shop-grid">{filtered.map(p=><ProductCard product={p} key={p.id}/>)}</div>:<div className="empty-state"><h2>No pieces found.</h2><p>Try changing your filters to explore more of the collection.</p><button className="button button-dark" onClick={reset}>CLEAR FILTERS</button></div>}</div></div></div>;
}
export function ShopClient(){return <Suspense fallback={<div className="section-shell shop-page">Loading collection...</div>}><ShopContents/></Suspense>}
