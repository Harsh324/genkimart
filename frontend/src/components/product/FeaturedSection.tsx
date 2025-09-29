"use client";

import { useEffect, useState } from "react";
import FeatureProduct from "@/components/product/FeatureProduct";
import { getProducts } from "@/lib/shopApi";
import type { ProductItem } from "@/types/content";

export default function FeaturedSection() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { results } = await getProducts({
          is_active: true,
          in_stock: true,
          ordering: "-id",
          page: 1,
        });
        setProducts((results ?? []));
      } catch (err) {
        console.error("Failed to load featured products:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return <FeatureProduct products={products} loading={loading} />;
}
