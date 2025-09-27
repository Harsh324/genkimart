import api from "./apiClient";
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
