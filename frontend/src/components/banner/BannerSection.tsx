"use client";

import { useEffect, useState } from "react";
import BannerMain from "@/components/banner/BannerMain";
import { getCategories } from "@/lib/shopApi";
import type { CategoryItem } from "@/types/content";

export default function BannerSection() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const cats = await getCategories();
        // console.log(cats)
        setCategories((cats ?? []));
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return <BannerMain banners={[]} categories={categories} loading={loading} />;
}
