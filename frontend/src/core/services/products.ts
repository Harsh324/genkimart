import { env } from '../config/env';
import type { Product } from '../types/product';
import productsJson from '@/data/Product.json'; // mock data from the template

export async function listProducts(params?: {
  q?: string; page?: number; pageSize?: number; category?: string;
}): Promise<{ items: Product[]; total: number; }> {
  if (env.API_BASE_URL === 'mock') {
    const all = productsJson as unknown as Product[];
    const filtered = params?.q
      ? all.filter(p => p.title.toLowerCase().includes(params.q!.toLowerCase()))
      : all;
    const page = params?.page ?? 1;
    const size = params?.pageSize ?? 24;
    const start = (page - 1) * size;
    return { items: filtered.slice(start, start + size), total: filtered.length };
  }
  // When backend ready, swap to:
  // return http(`/products?` + new URLSearchParams({ ... }));
  throw new Error('HTTP mode not implemented yet');
}

export async function getProductBySlug(slug: string): Promise<Product> {
  if (env.API_BASE_URL === 'mock') {
    const all = productsJson as unknown as Product[];
    const item = all.find(p => p.slug === slug);
    if (!item) throw new Error('Not found');
    return item;
  }
  // return http(`/products/${slug}`);
  throw new Error('HTTP mode not implemented yet');
}
