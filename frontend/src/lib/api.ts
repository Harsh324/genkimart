// // src/lib/api.ts
// const API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

// async function safeJson<T>(res: Response): Promise<T> {
//   if (!res.ok) throw new Error(`HTTP ${res.status}`);
//   return res.json() as Promise<T>;
// }

// export async function getBanners() {
//   if (!API_BASE) return [] as import("@/types/content").BannerItem[];
//   const url = `${API_BASE}/banners/`;
//   const res = await fetch(url, { next: { revalidate: 60 } });
//   return safeJson<import("@/types/content").BannerItem[]>(res);
// }

// export async function getCategories() {
//   if (!API_BASE) return [] as import("@/types/content").CategoryItem[];
//   const url = `${API_BASE}/categories/`;
//   const res = await fetch(url, { next: { revalidate: 300 } });
//   return safeJson<import("@/types/content").CategoryItem[]>(res);
// }

// export async function getFeaturedProducts() {
//   if (!API_BASE) return [] as import("@/types/content").ProductItem[];
//   const url = `${API_BASE}/products/featured/`;
//   const res = await fetch(url, { next: { revalidate: 120 } });
//   return safeJson<import("@/types/content").ProductItem[]>(res);
// }

// export async function getProducts() {
//   if (!API_BASE) return [] as import("@/types/content").ProductItemt[];
//   const url = `${API_BASE}/products/`; // adjust path to your DRF list endpoint
//   const res = await fetch(url, { next: { revalidate: 120 } });
//   return safeJson<import("@/types/content").ProductItem>(res);
// }

// export async function getBrands() {
//   if (!API_BASE) return [] as import("@/types/content").BrandItem[];
//   const url = `${API_BASE}/brands/`; // adjust path to your DRF list endpoint
//   const res = await fetch(url, { next: { revalidate: 120 } });
//   return safeJson<import("@/types/content").BrandItem[]>(res);
// }

// export async function getWeeklyBestSellingTabs() {
//   if (!API_BASE) return [] as import("@/types/content").BestSellingTab[];
//   const url = `${API_BASE}/analytics/best-selling?limit=4`;
//   const res = await fetch(url, { next: { revalidate: 120 } });
//   return safeJson<import("@/types/content").BestSellingTab[]>(res);
// }



// src/lib/api.ts
const API_BASE = process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL;

async function safeJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

// Fallback JSONs
import ProductsFallback from "@/data/Product.json";
import CategoriesFallback from "@/data/Categories.json";
import BrandsFallback from "@/data/Brands.json";

// ---- Helpers ----
function isNonEmptyArray(x: unknown): x is any[] {
  return Array.isArray(x) && x.length > 0;
}

async function fetchArrayOr<T>(url: string, init: RequestInit, orValue: T[]): Promise<T[]> {
  try {
    const res = await fetch(url, init);
    const data = await safeJson<T[]>(res);
    return isNonEmptyArray(data) ? data : orValue;
  } catch {
    return orValue;
  }
}

// ---- Content APIs ----
export async function getBanners() {
  if (!API_BASE) return [] as import("@/types/content").BannerItem[];
  const url = `${API_BASE}/banners/`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  return safeJson<import("@/types/content").BannerItem[]>(res);
}

export async function getCategories() {
  const url = API_BASE ? `${API_BASE}/categories/` : "";
  const init = { next: { revalidate: 300 } as any };

  return API_BASE
    ? fetchArrayOr<import("@/types/content").CategoryItem>(url, init, CategoriesFallback as any)
    : (CategoriesFallback as any);
}

export async function getFeaturedProducts() {
  // if (!API_BASE) return [] as import("@/types/content").ProductItem[];
  // const url = `${API_BASE}/products/featured/`;
  // const res = await fetch(url, { next: { revalidate: 120 } });
  // return safeJson<import("@/types/content").ProductItem[]>(res);

  const url = API_BASE ? `${API_BASE}/products//featured/` : "";
  const init = { next: { revalidate: 120 } as any };

  return API_BASE
    ? fetchArrayOr<import("@/types/content").ProductItem>(url, init, ProductsFallback as any)
    : (ProductsFallback as any);
}

export async function getProducts() {
  const url = API_BASE ? `${API_BASE}/products/` : "";
  const init = { next: { revalidate: 120 } as any };

  return API_BASE
    ? fetchArrayOr<import("@/types/content").ProductItem>(url, init, ProductsFallback as any)
    : (ProductsFallback as any);
}

export async function getBrands() {
  const url = API_BASE ? `${API_BASE}/brands/` : "";
  const init = { next: { revalidate: 120 } as any };

  return API_BASE
    ? fetchArrayOr<import("@/types/content").BrandItem>(url, init, BrandsFallback as any)
    : (BrandsFallback as any);
}

export async function getWeeklyBestSellingTabs() {
  if (!API_BASE) return [] as import("@/types/content").BestSellingTab[];
  const url = `${API_BASE}/analytics/best-selling?limit=4`;
  const res = await fetch(url, { next: { revalidate: 120 } });
  return safeJson<import("@/types/content").BestSellingTab[]>(res);
}
