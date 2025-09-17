"use client";

import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import Image from "next/image";
import Link from "next/link";
import Shimmer from "../common/Shimmer";
import type { CategoryItem } from "@/types/content";
import "swiper/css";
import "swiper/css/navigation";

type Props = {
    categories?: CategoryItem[];
    loading?: boolean;
};

const fallback: CategoryItem[] = [
    { id: 1, name: "Organic Vegetable", imageUrl: "/assets/images/category/01.png", href: "/shop" },
    { id: 2, name: "Organic Vegetable", imageUrl: "/assets/images/category/02.png", href: "/shop" },
    { id: 3, name: "Organic Vegetable", imageUrl: "/assets/images/category/03.png", href: "/shop" },
    { id: 4, name: "Organic Vegetable", imageUrl: "/assets/images/category/04.png", href: "/shop" },
    { id: 5, name: "Organic Vegetable", imageUrl: "/assets/images/category/05.png", href: "/shop" },
    { id: 6, name: "Organic Vegetable", imageUrl: "/assets/images/category/06.png", href: "/shop" },
    { id: 7, name: "Organic Vegetable", imageUrl: "/assets/images/category/07.png", href: "/shop" },
    { id: 8, name: "Organic Vegetable", imageUrl: "/assets/images/category/08.png", href: "/shop" },
    { id: 9, name: "Organic Vegetable", imageUrl: "/assets/images/category/09.png", href: "/shop" },
    { id: 10, name: "Organic Vegetable", imageUrl: "/assets/images/category/10.png", href: "/shop" },
];

function CategoryBannerBottom({ categories = [], loading = false }: Props) {
    if (loading) {
        return (
            <div className="rts-caregory-area-one container">
                <div className="flex gap-4 overflow-hidden">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <Shimmer width={60} height={60} className="rounded-full mb-2" />
                            <Shimmer width={80} height={12} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    const items = categories.length ? categories : fallback;

    return (
        <div className="rts-caregory-area-one">
            <div className="container">
                <div className="row">
                    <div className="col-lg-12">
                        <div className="category-area-main-wrapper-one">
                            <Swiper
                                modules={[Navigation, Autoplay]}
                                spaceBetween={12}
                                slidesPerView={10}
                                loop
                                speed={1000}
                                autoplay={{ delay: 3000, disableOnInteraction: false }}
                                breakpoints={{
                                0: { slidesPerView: 2, spaceBetween: 12 },
                                320: { slidesPerView: 2, spaceBetween: 12 },
                                480: { slidesPerView: 3, spaceBetween: 12 },
                                640: { slidesPerView: 4, spaceBetween: 12 },
                                840: { slidesPerView: 4, spaceBetween: 12 },
                                1140: { slidesPerView: 10, spaceBetween: 12 },
                                }}
                            >
                                {items.map((cat) => (
                                <SwiperSlide key={cat.id}>
                                    <Link href={cat.href || "/shop"} className="single-category-one">
                                    <Image
                                        src={cat.imageUrl}
                                        alt={cat.name}
                                        width={60}
                                        height={60}
                                        style={{ objectFit: "contain" }}
                                    />
                                    <p>{cat.name}</p>
                                    </Link>
                                </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CategoryBannerBottom;
