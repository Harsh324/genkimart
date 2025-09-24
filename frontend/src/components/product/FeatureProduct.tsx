"use client";

import React, { useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import WeeklyBestSellingMain from "@/components/product-main/WeeklyBestSellingMain";
import type { ProductItem } from "@/types/content";
import "swiper/css";
import "swiper/css/navigation";

import Fallback from "@/data/Product.json"; // keeps your current JSON as fallback

type Props = {
    products?: ProductItem[];
    loading?: boolean;
};

function FeatureProduct({ products = [], loading = false }: Props) {
    useEffect(() => {
        const handle = (e: Event) => {
            const button = e.currentTarget as HTMLElement;
            const parent = button.closest(".quantity-edit") as HTMLElement | null;
            if (!parent) return;
            const input = parent.querySelector(".input") as HTMLInputElement | null;
            const addToCart = parent.querySelector("a.add-to-cart") as HTMLElement | null;
            if (!input) return;

            const oldValue = Number.parseInt(input.value || "1", 10);
            const newVal = button.classList.contains("plus")
                ? oldValue + 1
                : Math.max(1, oldValue - 1);

            input.value = String(newVal);
            if (addToCart) addToCart.setAttribute("data-quantity", String(newVal));
        };

        const buttons = Array.from(document.querySelectorAll(".quantity-edit .button"));
        buttons.forEach((b) => {
            b.removeEventListener("click", handle);
            b.addEventListener("click", handle);
        });
        return () => buttons.forEach((b) => b.removeEventListener("click", handle));
    }, []);

    // ----- data: use API products or fallback JSON -----
    const items: ProductItem[] =
        products.length > 0
        ? products
        : (Fallback as ProductItem[]).filter(Boolean);

    // ----- scoped navigation (prevents cross-slider conflicts) -----
    const prevRef = useRef<HTMLButtonElement | null>(null);
    const nextRef = useRef<HTMLButtonElement | null>(null);

    // ----- shimmer while loading -----
    if (loading) {
        return (
            <div className="rts-grocery-feature-area rts-section-gapBottom">
                <div className="container">
                    <div className="title-area-between">
                        <div className="h-8 w-40 bg-gray-300 animate-pulse rounded" />
                            <div className="flex gap-3">
                            <div className="h-8 w-8 bg-gray-300 animate-pulse rounded-full" />
                            <div className="h-8 w-8 bg-gray-300 animate-pulse rounded-full" />
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="single-shopping-card-one p-3">
                                <div className="h-32 w-full bg-gray-200 animate-pulse rounded mb-3" />
                                <div className="h-4 w-3/4 bg-gray-200 animate-pulse rounded mb-2" />
                                <div className="h-4 w-1/2 bg-gray-200 animate-pulse rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
        {/* rts grocery feature area start */}
        <div className="rts-grocery-feature-area rts-section-gapBottom">
            <div className="container">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="title-area-between">
                            <h2 className="title-left">Featured Items</h2>
                            <div className="next-prev-swiper-wrapper">
                                <button ref={prevRef} className="swiper-button-prev">
                                    <i className="fa-regular fa-chevron-left" />
                                </button>
                                <button ref={nextRef} className="swiper-button-next">
                                    <i className="fa-regular fa-chevron-right" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Slider */}
            <div className="container">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="category-area-main-wrapper-one">
                            <Swiper
                                modules={[Navigation, Autoplay]}
                                autoplay={{ delay: 3000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                                loop={items.length > 6}
                                onBeforeInit={(swiper) => {
                                    // @ts-expect-error – Swiper types allow updates at runtime
                                    swiper.params.navigation.prevEl = prevRef.current;
                                    // @ts-expect-error
                                    swiper.params.navigation.nextEl = nextRef.current;
                                }}
                                navigation={{
                                    prevEl: prevRef.current,
                                    nextEl: nextRef.current,
                                }}
                                breakpoints={{
                                    0: { slidesPerView: 1, spaceBetween: 30 },
                                    320: { slidesPerView: 2, spaceBetween: 30 },
                                    480: { slidesPerView: 3, spaceBetween: 30 },
                                    640: { slidesPerView: 3, spaceBetween: 30 },
                                    840: { slidesPerView: 4, spaceBetween: 30 },
                                    1140: { slidesPerView: 6, spaceBetween: 30 },
                                }}
                                className="mySwiper-feature-products"
                            >
                                {items.map((p) => (
                                    <SwiperSlide key={p.slug}>
                                        <div className="single-shopping-card-one">
                                            <WeeklyBestSellingMain product={p} />
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {/* rts grocery feature area end */}
        </>
    );
}

export default FeatureProduct;
