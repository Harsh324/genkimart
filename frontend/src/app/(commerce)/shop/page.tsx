"use client";

import HeaderOne from "@/components/header/HeaderOne";
import { useEffect, useMemo, useState, Suspense } from "react";
import ShopMain from "./ShopMain";
import FooterOne from "@/components/footer/FooterOne";
import { useSearchParams } from "next/navigation";
import { getProducts, getCategories, getBrands } from "@/lib/api";
import type { ProductItem, CategoryItem, BrandItem } from "@/types/content";
import WeeklyBestSellingMain from "@/components/product-main/WeeklyBestSellingMain";

function ShopContent() {
    const searchParams = useSearchParams();
    const searchQuery = (searchParams.get("search") || "").toLowerCase();

    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [minPrice, setMinPrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(150);

    const [products, setProducts] = useState<ProductItem[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [brands, setBrands] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    // Ensure anything coming from API/fallback conforms to ProductItem
    const normalizeProduct = (p: any): ProductItem => ({
        slug: String(p?.slug ?? p?.sku ?? p?.id ?? crypto.randomUUID()),
        image: p?.image ?? p?.image_url ?? p?.imageUrl ?? "",
        title: p?.title ?? p?.name ?? "",
        price: p?.price,
        compareAtPrice: p?.compareAtPrice ?? p?.compare_at_price,
        unitLabel: p?.unitLabel ?? p?.unit_label ?? "500g Pack",
        discountPercent: typeof p?.discountPercent === "number" ? p.discountPercent : p?.discount_percent,
        category: p?.category ?? p?.category_name ?? p?.category?.name,
        sku: p?.sku,
        description: p?.description,
    });

    const toNameList = (arr: (CategoryItem | BrandItem | string)[]): string[] =>
        (arr || [])
            .map((x: any) => (typeof x === "string" ? x : x?.name ?? x?.title ?? x?.label ?? ""))
            .filter(Boolean);

    useEffect(() => {
        (async () => {
            try {
                const [p, c, b] = await Promise.all([getProducts(), getCategories(), getBrands()]);
                setProducts((p as any[]).map(normalizeProduct));
                setCategories(toNameList(c as any[]));
                setBrands(toNameList(b as any[]));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleCategoryChange = (category: string) => {
        setSelectedCategories((prev) =>
            prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
        );
    };

    const handleBrandChange = (brand: string) => {
        setSelectedBrands((prev) =>
            prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
        );
    };

    const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) setMinPrice(val);
    };

    const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        if (!isNaN(val)) setMaxPrice(val);
    };

    const filteredProducts = useMemo(() => {
        const priceNum = (p?: number | string) =>
            typeof p === "number" ? p : parseFloat(String(p ?? "0").replace(/[^0-9.]/g, "")) || 0;

        return products.filter((p) => {
            const inCat = selectedCategories.length === 0 || selectedCategories.includes(p.category || "");
            const inBrand = selectedBrands.length === 0 || selectedBrands.includes((p as any).brand || ""); // keep if you later add brand to ProductItem
            const inPrice = (() => {
                const n = priceNum(p.price);
                return n >= minPrice && n <= maxPrice;
            })();
            const inSearch = (() => {
                if (!searchQuery) return true;
                const title = (p.title || "").toLowerCase();
                const category = (p.category || "").toLowerCase();
                return title.includes(searchQuery) || category.includes(searchQuery);
            })();
            return inCat && inBrand && inPrice && inSearch;
        });
    }, [products, selectedCategories, selectedBrands, minPrice, maxPrice, searchQuery]);

    const handlePriceFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <div className="shop-page">
            {/* Breadcrumb */}
            <div className="rts-navigation-area-breadcrumb bg_light-1">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="navigator-breadcrumb-wrapper">
                                <a href="/">Home</a>
                                <i className="fa-regular fa-chevron-right" />
                                <a className="current" href="/shop">Shop</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="section-seperator bg_light-1">
                <div className="container">
                    <hr className="section-seperator" />
                </div>
            </div>

            <div className="shop-grid-sidebar-area rts-section-gap">
                <div className="container">
                    <div className="row g-0">
                        {/* Sidebar */}
                        <div className="col-xl-3 col-lg-12 pr--70 pr_lg--10 pr_sm--10 pr_md--5 rts-sticky-column-item">
                            <div className="sidebar-filter-main theiaStickySidebar">
                                {/* Price Filter */}
                                <div className="single-filter-box">
                                    <h5 className="title">Widget Price Filter</h5>
                                    <div className="filterbox-body">
                                        <form action="#" className="price-input-area" onSubmit={handlePriceFilterSubmit}>
                                            <div className="half-input-wrapper">
                                                <div className="single">
                                                    <label htmlFor="min">Min price</label>
                                                    <input id="min" type="number" value={minPrice} min={0} onChange={handleMinPriceChange} />
                                                </div>
                                                <div className="single">
                                                    <label htmlFor="max">Max price</label>
                                                    <input id="max" type="number" value={maxPrice} min={0} onChange={handleMaxPriceChange} />
                                                </div>
                                            </div>
                                            <input
                                                type="range"
                                                className="range"
                                                min={0}
                                                max={150}
                                                value={maxPrice}
                                                onChange={(e) => setMaxPrice(parseInt(e.target.value, 10))}
                                            />
                                            <div className="filter-value-min-max">
                                                <span>Price: ${minPrice} — ${maxPrice}</span>
                                                <button type="submit" className="rts-btn btn-primary">Filter</button>
                                            </div>
                                        </form>
                                    </div>
                                </div>

                                {/* Categories */}
                                <div className="single-filter-box">
                                    <h5 className="title">Product Categories</h5>
                                    <div className="filterbox-body">
                                        <div className="category-wrapper ">
                                            {(categories.length ? categories : ["Beverages", "Biscuits & Snacks", "Breads & Bakery"]).map((cat, i) => (
                                                <div className="single-category" key={i}>
                                                    <input
                                                        id={`cat${i + 1}`}
                                                        type="checkbox"
                                                        checked={selectedCategories.includes(cat)}
                                                        onChange={() => handleCategoryChange(cat)}
                                                    />
                                                    <label htmlFor={`cat${i + 1}`}>{cat}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Brands (optional list stays for future) */}
                                <div className="single-filter-box">
                                    <h5 className="title">Select Brands</h5>
                                    <div className="filterbox-body">
                                        <div className="category-wrapper">
                                            {(brands.length ? brands : ["Frito Lay", "Nespresso", "Oreo", "Quaker", "Welch's"]).map((brand, i) => (
                                                <div className="single-category" key={i}>
                                                    <input
                                                        id={`brand${i + 1}`}
                                                        type="checkbox"
                                                        checked={selectedBrands.includes(brand)}
                                                        onChange={() => handleBrandChange(brand)}
                                                    />
                                                    <label htmlFor={`brand${i + 1}`}>{brand}</label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="col-xl-9 col-lg-12">
                            <div className="filter-select-area">
                                <div className="top-filter">
                                    <span>{loading ? "Loading..." : `Showing ${filteredProducts.length} results`}</span>
                                </div>
                            </div>

                            {/* Grid view only */}
                            <div className="product-area-wrapper-shopgrid-list mt--20">
                                <div className="row g-4">
                                    {!loading && filteredProducts.length > 0 ? (
                                        filteredProducts.map((post: ProductItem, index: number) => (
                                            <div key={post.slug ?? index} className="col-lg-20 col-lg-4 col-md-6 col-sm-6 col-12">
                                                <div className="single-shopping-card-one">
                                                    {/* <ShopMain product={post} /> */}
                                                    <WeeklyBestSellingMain product={post} />
                                                </div>
                                            </div>
                                        ))
                                    ) : loading ? (
                                        <div className="col-12 text-center py-5"><h2>Loading...</h2></div>
                                    ) : (
                                        <div className="col-12 text-center py-5"><h2>No Product Found</h2></div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Page() {
    return (
        <>
            <HeaderOne />
            <Suspense
                fallback={
                    <div className="text-center py-20">
                        <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3">Loading products...</p>
                    </div>
                }
            >
                <ShopContent />
            </Suspense>
            <FooterOne />
        </>
    );
}
