"use client";

import { useEffect, useMemo, useState } from "react";
import WeeklyBestSellingMain from "@/components/product-main/WeeklyBestSellingMain";
import type { BestSellingTab, ProductItem } from "@/types/content";

import categoriesJSON from "@/data/Categories.json";
import productsJSON from "@/data/Product.json";

/* ---------- Local util (temporary) ---------- */

type RawProduct = Partial<{
    slug: string; image: string; title: string;
    price: string | number; compareAtPrice: string | number;
    unitLabel: string; discountPercent: number;
    category: string; sku: string; description: string;
}>;

type RawCategory = Partial<{ id: string | number; name: string }>;

function buildBestSellingTabsFromJSON(
    rawProducts: RawProduct[],
    rawCategories: RawCategory[],
    itemsPerTab = 6
): BestSellingTab[] {
    const allProducts: ProductItem[] = rawProducts.map((p, idx) => ({
        slug: String(p?.slug ?? `product-${idx + 1}`),
        image: String(p?.image ?? ""),
        title: p?.title ?? undefined,
        price: p?.price,
        compareAtPrice: p?.compareAtPrice,
        unitLabel: p?.unitLabel,
        discountPercent: p?.discountPercent,
        category: p?.category,
        sku: p?.sku,
        description: p?.description,
    }));

    const cats = rawCategories.slice(0, 4);
    return cats.map((c, i): BestSellingTab => {
        const start = i * itemsPerTab;
        const products = allProducts.slice(start, start + itemsPerTab);
        return {
            id: c?.id ?? i,
            name: c?.name ?? `Category ${i + 1}`,
            products,
        };
    });
}

/* ---------- Component ---------- */

type Props = {
    tabs?: BestSellingTab[]; // optional: API-provided tabs
    loading?: boolean;
    itemsPerTab?: number;
};

export default function WeeklyBestSelling({
    tabs,
    loading = false,
    itemsPerTab = 6,
}: Props) {
    // fallback built locally (temporary)
    const fallbackTabs = useMemo(
        () =>
            buildBestSellingTabsFromJSON(
                productsJSON as RawProduct[],
                categoriesJSON as RawCategory[],
                itemsPerTab
            ),
        [itemsPerTab]
    );

    const tabsToUse = tabs?.length ? tabs : fallbackTabs;

    const [activeId, setActiveId] = useState<BestSellingTab["id"] | null>(
        tabsToUse[0]?.id ?? null
    );

    // keep active tab valid when data changes
    useEffect(() => {
        if (!tabsToUse.length) {
            setActiveId(null);
            return;
        }
        if (!tabsToUse.some((t) => t.id === activeId)) {
            setActiveId(tabsToUse[0].id);
        }
    }, [tabsToUse, activeId]);

    const activeProducts = useMemo(
        () => tabsToUse.find((t) => t.id === activeId)?.products ?? [],
        [tabsToUse, activeId]
    );

    /* ---------- Shimmer ---------- */
    if (loading) {
        return (
            <div className="weekly-best-selling-area rts-section-gap bg_light-1">
                <div className="container">
                    <div className="title-area-between">
                        <h2 className="title-left">Weekly Best Selling</h2>
                        <ul className="nav nav-tabs best-selling-grocery">
                            {Array.from({ length: Math.min(4, tabsToUse.length || 4) }).map((_, i) => (
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
                        {tabsToUse.map((tab) => (
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
                                {/* pass the FULL product */}
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
