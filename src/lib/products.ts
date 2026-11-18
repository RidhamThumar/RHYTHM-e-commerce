export type Product = {
  id: string; slug: string; name: string; category: 'Tops' | 'Outerwear' | 'Bottoms' | 'Accessories';
  price: number; color: string; sizes: string[]; image: string; secondaryImage?: string;
  tag?: string; description: string; stock: number; featured?: boolean; stockBySize?: Record<string,number>;
};
export const products: Product[] = [
  {id:'1',slug:'relaxed-cotton-shirt',name:'Relaxed Cotton Shirt',category:'Tops',price:89,color:'Ivory',sizes:['XS','S','M','L','XL'],image:'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=1000&auto=format&fit=crop&q=85',tag:'BESTSELLER',description:'A relaxed silhouette in breathable cotton, made for everyday wear.',stock:16,featured:true},
  {id:'2',slug:'structured-wool-coat',name:'Structured Wool Coat',category:'Outerwear',price:249,color:'Charcoal',sizes:['S','M','L'],image:'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=1000&auto=format&fit=crop&q=85',tag:'NEW',description:'Clean lines and a considered fit in a soft wool blend.',stock:8,featured:true},
  {id:'3',slug:'wide-leg-trouser',name:'Wide Leg Trouser',category:'Bottoms',price:119,color:'Sand',sizes:['XS','S','M','L'],image:'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=1000&auto=format&fit=crop&q=85',description:'Relaxed tailoring with a fluid, modern drape.',stock:12,featured:true},
  {id:'4',slug:'everyday-crewneck',name:'Everyday Crewneck',category:'Tops',price:79,color:'Stone',sizes:['S','M','L','XL'],image:'https://images.unsplash.com/photo-1578681994506-b8f463449011?w=1000&auto=format&fit=crop&q=85',tag:'NEW',description:'Soft, versatile and intentionally understated.',stock:22,featured:true},
  {id:'5',slug:'minimal-leather-bag',name:'Minimal Leather Bag',category:'Accessories',price:169,color:'Black',sizes:['One size'],image:'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=1000&auto=format&fit=crop&q=85',description:'A pared-back daily carry with durable finishing.',stock:5},
  {id:'6',slug:'relaxed-denim',name:'Relaxed Denim',category:'Bottoms',price:139,color:'Charcoal',sizes:['XS','S','M','L'],image:'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=1000&auto=format&fit=crop&q=85',description:'Classic denim reworked in a contemporary relaxed fit.',stock:10},
  {id:'7',slug:'organic-ribbed-tee',name:'Organic Ribbed Tee',category:'Tops',price:49,color:'Ivory',sizes:['XS','S','M','L','XL'],image:'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1000&auto=format&fit=crop&q=85',description:'An essential silhouette with a soft ribbed texture.',stock:28},
  {id:'8',slug:'utility-overshirt',name:'Utility Overshirt',category:'Outerwear',price:159,color:'Sand',sizes:['S','M','L','XL'],image:'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1000&auto=format&fit=crop&q=85',description:'A useful layering piece with refined utility detailing.',stock:14}
];
export const formatPrice = (n:number) => `$${n.toFixed(2)}`;
