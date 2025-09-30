"use client";

import { useEffect, useMemo, useState } from "react";
import WeeklyBestSellingMain from "@/components/product-main/WeeklyBestSellingMain";
import type { BestSellingTab, ProductItem, CategoryItem } from "@/types/content";
import { getProducts, getCategories } from "@/lib/shopApi"; // adjust import if path differs

type Props = {
    itemsPerTab?: number;
};

export default function WeeklyBestSelling({ itemsPerTab = 6 }: Props) {
    const [tabs, setTabs] = useState<BestSellingTab[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeId, setActiveId] = useState<BestSellingTab["id"] | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                const [catRes, prodRes] = await Promise.all([
                    getCategories({ page: 1 }),
                    getProducts({ page: 1 }),
                ]);

                const categories: CategoryItem[] = catRes.results.slice(0, 4);
                const products: ProductItem[] = prodRes.results;

                // distribute products across categories
                const builtTabs: BestSellingTab[] = categories.map((c, i) => {
                    const start = i * itemsPerTab;
                    const catProducts = products.slice(start, start + itemsPerTab);
                    return {
                        id: c.id,
                        name: c.name,
                        products: catProducts,
                    };
                });

                setTabs(builtTabs);
                setActiveId(builtTabs[0]?.id ?? null);
            } catch (err) {
                console.error("Failed to load WeeklyBestSelling:", err);
                setTabs([]);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [itemsPerTab]);

    // active products
    const activeProducts = useMemo(
        () => tabs.find((t) => t.id === activeId)?.products ?? [],
        [tabs, activeId]
    );

    /* ---------- Shimmer ---------- */
    if (loading) {
        return (
            <div className="weekly-best-selling-area rts-section-gap bg_light-1">
                <div className="container">
                    <div className="title-area-between">
                        <h2 className="title-left">Weekly Best Selling</h2>
                        <ul className="nav nav-tabs best-selling-grocery">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <li key={i} className="nav-item">
                                    <button className="nav-link disabled">Loading…</button>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="row g-4 mt-2">
                        {Array.from({ length: itemsPerTab * 2 }).map((_, i) => (
                            <div key={i} className="col-xxl-2 col-xl-3 col-lg-4 col-md-4 col-sm-6 col-12">
                                <div className="single-shopping-card-one">
                                    <div className="animate-pulse bg-gray-200 rounded w-100" style={{ height: 140 }} />
                                    <div className="animate-pulse bg-gray-200 rounded mt-3" style={{ height: 14, width: "70%" }} />
                                    <div className="animate-pulse bg-gray-200 rounded mt-2" style={{ height: 14, width: "40%" }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    /* ---------- Render ---------- */
    return (
        <div className="weekly-best-selling-area rts-section-gap bg_light-1">
            <div className="container">
                <div className="title-area-between">
                    <h2 className="title-left">Weekly Best Selling</h2>
                    <ul className="nav nav-tabs best-selling-grocery" role="tablist">
                        {tabs.map((tab) => (
                            <li key={tab.id} className="nav-item" role="presentation">
                                <button
                                    onClick={() => setActiveId(tab.id)}
                                    className={`nav-link ${activeId === tab.id ? "active" : ""}`}
                                >
                                    {tab.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="row g-4 mt-2">
                    {activeProducts.map((p) => (
                        <div key={p.slug} className="col-xxl-2 col-xl-3 col-lg-4 col-md-4 col-sm-6 col-12">
                            <div className="single-shopping-card-one">
                                <WeeklyBestSellingMain product={p} />
                            </div>
                        </div>
                    ))}

                    {!activeProducts.length && (
                        <div className="col-12">
                            <p className="mt-3">No products available.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
