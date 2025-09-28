import { api } from "./apiClient";
import type { ProductItem, PagedResult, BrandItem, CategoryItem } from "@/types/shop";

// Products list with optional filters/sorts/pagination
export async function getProducts(params: {
  page?: number; page_size?: number;
  search?: string;
  category?: string;
  brand?: string;
  sorts?: string;      // e.g. "-price" or "price"
  filters?: string;    // if your DRF view expects JSON string or key=value pairs
}) {
  const { data } = await api.get<PagedResult<ProductItem>>("/marketplace/items/", { params });
  return data;
}

// Single product by slug or id
export async function getProduct(identifier: { slug?: string; id?: string | number }) {
  if (identifier.slug) {
    const { data } = await api.get<ProductItem>(`/marketplace/items/${identifier.slug}/`);
    return data;
  }
  if (identifier.id !== undefined) {
    const { data } = await api.get<ProductItem>(`/marketplace/items/${identifier.id}/`);
    return data;
  }
  throw new Error("getProduct requires slug or id");
}

// Brands (API with JSON fallback)
export async function getBrands() {
  try {
    const { data } = await api.get<BrandItem[]>("/marketplace/brands/");
    return data;
  } catch {
    const res = await fetch("/data/brands.json", { cache: "force-cache" });
    return (await res.json()) as BrandItem[];
  }
}

// Categories (API with JSON fallback)
export async function getCategories() {
  try {
    const { data } = await api.get<CategoryItem[]>("/marketplace/categories/");
    return data;
  } catch {
    const res = await fetch("/data/categories.json", { cache: "force-cache" });
    return (await res.json()) as CategoryItem[];
  }
}


const normalizeProduct = (raw: any): ProductItem => ({
  id: raw.id,
  slug: raw.slug ?? String(raw.id),
  image: raw.image_url ?? raw.image ?? "/assets/images/grocery/03.jpg",
  title: raw.title ?? raw.name,
  price: raw.price,
  compareAtPrice: raw.compare_at_price ?? raw.msrp ?? 275,
  unitLabel: raw.unit_label ?? raw.unit ?? "200 Ml",
  discountPercent:
    raw.discount_percent ??
    (raw.compare_at_price && raw.price
      ? Math.round(((raw.compare_at_price - raw.price) / raw.compare_at_price) * 100)
      : undefined),
  category: raw.category?.name ?? raw.category ?? undefined,
  brand: raw.brand?.name ?? raw.brand ?? "Param",
  sku: raw.sku ?? "NEEDTOADDTHISFIELD",
  description: raw.description ?? undefined,
});


// export async function getFeaturedProducts(): Promise<ProductItem[]> {
//   const { data } = await api.get("/api/catalog/products/", {
//     params: {},
//   });

//   const items = Array.isArray(data?.results)
//     ? data.results
//     : Array.isArray(data)
//     ? data
//     : [];

//   return items.map(normalizeProduct);
// }

export async function getFeaturedProducts(limit = 18): Promise<ProductItem[]> {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error(
      "NEXT_PUBLIC_API_BASE_URL is not set. Add it to .env.local (e.g., http://localhost:8000)."
    );
  }

  // NOTE: DRF usually handles trailing slash either way; keep it consistent with your API.
  const url = `${base.replace(/\/$/, "")}/api/catalog/products/?is_featured=true&page_size=${limit}`;

  // No caching & include cookies if your API uses httpOnly JWT cookies
  const res = await fetch(url, { cache: "no-store", credentials: "include" });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Featured fetch failed: ${res.status} ${res.statusText} — ${text}`);
  }

  const data = await res.json();

  const items = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data)
    ? data
    : [];

  return items.map(normalizeProduct);
}