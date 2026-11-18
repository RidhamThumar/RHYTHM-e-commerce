import type { Metadata } from 'next';
import { ShopClient } from '@/components/ShopClient';
export const metadata:Metadata={title:'Shop All'};
export default function Shop(){return <ShopClient/>}
