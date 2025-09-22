// src/lib/api.ts
const API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

async function safeJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getBanners() {
  if (!API_BASE) return [] as import("@/types/content").BannerItem[];
  const url = `${API_BASE}/banners/`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  return safeJson<import("@/types/content").BannerItem[]>(res);
}

export async function getCategories() {
  if (!API_BASE) return [] as import("@/types/content").CategoryItem[];
  const url = `${API_BASE}/categories/`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  return safeJson<import("@/types/content").CategoryItem[]>(res);
}

export async function getFeaturedProducts() {
  if (!API_BASE) return [] as import("@/types/content").ProductItem[];
  const url = `${API_BASE}/products/featured/`;
  const res = await fetch(url, { next: { revalidate: 120 } });
  return safeJson<import("@/types/content").ProductItem[]>(res);
}

export async function getWeeklyBestSellingTabs() {
  if (!API_BASE) return [] as import("@/types/content").BestSellingTab[];
  const url = `${API_BASE}/analytics/best-selling?limit=4`;
  const res = await fetch(url, { next: { revalidate: 120 } });
  return safeJson<import("@/types/content").BestSellingTab[]>(res);
}