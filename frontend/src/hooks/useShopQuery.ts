"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getProducts } from "@/lib/shopApi";
import type { ProductItem, PagedResult } from "@/types/shop";

export function useShopQuery() {
  const sp = useSearchParams();
  const [data, setData] = useState<PagedResult<ProductItem> | null>(null);
  const [loading, setLoading] = useState(true);

  const page = Number(sp.get("page") || 1);
  const page_size = Number(sp.get("page_size") || 12);
  const search = sp.get("search") || undefined;
  const category = sp.get("category") || undefined;
  const brand = sp.get("brand") || undefined;
  const sorts = sp.get("sorts") || undefined;
  const filters = sp.get("filters") || undefined;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    getProducts({ page, page_size, search, category, brand, sorts, filters })
      .then(d => mounted && setData(d))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [page, page_size, search, category, brand, sorts, filters]);

  return { data, loading, page, page_size };
}
