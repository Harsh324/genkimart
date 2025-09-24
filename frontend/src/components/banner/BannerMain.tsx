"use client";
import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import CategoryBb from "./CategoryBb";
import Shimmer from "../common/Shimmer";
import type { BannerItem, CategoryItem } from "@/types/content";
import "swiper/css";
import "swiper/css/navigation";

type Props = {
    banners: BannerItem[];
    categories: CategoryItem[];
    loading?: boolean;
};

const BannerMain: React.FC<Props> = ({ banners = [], categories = [], loading = false }) => {
    if (loading) {
        return (
            <div className="background-light-gray-color rts-section-gap bg_light-1 pt_sm--20">
                <div className="rts-banner-area-one mb--30 container">
                    <Shimmer height="300px" className="w-full mb-6" />
                    <CategoryBb categories={[]} loading />
                </div>
            </div>
        );
    }

    const slides = banners.length
        ? banners
        : [
            {
                id: "fallback-1",
                headline: "Do not miss our amazing grocery deals",
                subtext: "Get up to 30% off on your first $150 purchase",
                ctaText: "Shop Now",
                ctaHref: "/shop",
                imageKey: "bg_one-banner",
            },
            {
                id: "fallback-2",
                headline: "Do not miss our amazing grocery deals",
                subtext: "Get up to 30% off on your first $150 purchase",
                ctaText: "Shop Now",
                ctaHref: "/shop",
                imageKey: "bg_one-banner two",
            },
        ];

    return (
        <div className="background-light-gray-color rts-section-gap bg_light-1 pt_sm--20">
            <div className="rts-banner-area-one mb--30">
                <div className="container">
                    <div className="row">
                        <div className="col-lg-12">
                            <div className="category-area-main-wrapper-one">
                                <Swiper
                                    modules={[Navigation, Autoplay]}
                                    spaceBetween={1}
                                    slidesPerView={1}
                                    loop
                                    speed={2000}
                                    autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                                    navigation={{ nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" }}
                                    breakpoints={{
                                        0: { slidesPerView: 1, spaceBetween: 0 },
                                        320: { slidesPerView: 1, spaceBetween: 0 },
                                        480: { slidesPerView: 1, spaceBetween: 0 },
                                        640: { slidesPerView: 1, spaceBetween: 0 },
                                        840: { slidesPerView: 1, spaceBetween: 0 },
                                        1140: { slidesPerView: 1, spaceBetween: 0 },
                                    }}
                                    >
                                    {slides.map((s) => (
                                        <SwiperSlide key={s.id}>
                                            <div className={`banner-bg-image bg_image ${s.imageKey} ptb--120 ptb_md--80 ptb_sm--60`}>
                                                <div className="banner-one-inner-content">
                                                    {s.subtext && <span className="pre">{s.subtext}</span>}
                                                    <h1 className="title">{s.headline}</h1>
                                                    {s.ctaText && s.ctaHref && (
                                                        <a href={s.ctaHref} className="rts-btn btn-primary radious-sm with-icon">
                                                            <div className="btn-text">{s.ctaText}</div>
                                                                <div className="arrow-icon">
                                                                    <i className="fa-light fa-arrow-right" />
                                                                </div>
                                                            <div className="arrow-icon">
                                                                <i className="fa-light fa-arrow-right" />
                                                            </div>
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    ))}
                                </Swiper>
                                <button className="swiper-button-next">
                                    <i className="fa-regular fa-arrow-right" />
                                </button>
                                <button className="swiper-button-prev">
                                    <i className="fa-regular fa-arrow-left" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Category carousel under banner */}
            <CategoryBb categories={categories} />
        </div>
    );
};

export default BannerMain;
