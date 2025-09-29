import { api, authless } from "./apiClient";
import type { ProductItem, PagedResult, BrandItem, CategoryItem } from "@/types/shop";

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

const normalizeProduct = (raw: any): ProductItem => ({
  id: raw.id,
  slug: raw.slug ?? String(raw.id),
  image: raw.image_url ?? raw.image ?? "/assets/images/grocery/03.jpg",
  title: raw.title ?? raw.name,
  price: raw.price,
  compareAtPrice: raw.compare_at_price ?? raw.msrp ?? undefined,
  unitLabel: raw.unit_label ?? raw.unit ?? undefined,
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

export async function getProducts(params?: {
  page?: number;
  search?: string;
  category?: string;          // uuid
  category_name?: string;
  in_stock?: boolean;
  is_active?: boolean;
  price_min?: number;
  price_max?: number;
  ordering?: string;          // e.g. "-price", "price", "-created_at"
}) {
  const { data } = await authless.get("/api/catalog/products", { params });

  const items = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data)
    ? data
    : [];

  return {
    count: data?.count ?? items.length,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
    results: items.map(normalizeProduct),
  };
}


export async function getCategories(params?: {
  page?: number;
  search?: string;
  ordering?: string;
}) {
  const { data } = await authless.get("/api/catalog/categories/", { params });

  const items = Array.isArray(data?.results)
    ? data.results
    : Array.isArray(data)
    ? data
    : [];

  return {
    count: data?.count ?? items.length,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
    results: items.map(normalizeCategory),
  };
}

const normalizeCategory = (raw: any): CategoryItem => ({
  id: raw.id,
  name: raw.name,
  imageUrl: raw.image ?? "/assets/images/category/02.png",
  href: `/shop?category=${raw.id}`,
});