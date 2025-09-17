const API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

async function safeJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getBanners() {
  const url = API_BASE ? `${API_BASE}/banners/` : `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/banners`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  return safeJson<import("@/types/content").BannerItem[]>(res);
}

export async function getCategories() {
  const url = API_BASE ? `${API_BASE}/categories/` : `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/api/categories`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  return safeJson<import("@/types/content").CategoryItem[]>(res);
}
