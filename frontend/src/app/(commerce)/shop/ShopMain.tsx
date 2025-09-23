"use client";
import React, { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/components/header/CartContext";
import { useWishlist } from "@/components/header/WishlistContext";
import ProductDetails from "@/components/modal/ProductDetails";
import type { ProductItem } from "@/types/content";

type Props = { product: ProductItem };

type NumLike = string | number | undefined;

function toNumber(n: NumLike) {
    const v = typeof n === 'string' ? parseFloat(n) : n;
    return Number.isFinite(v as number) ? (v as number) : undefined;
}

function formatPrice(n: NumLike) {
    const num = toNumber(n);
    return num === undefined ? '' : `¥${num.toFixed(2)}`;
}

function deriveDiscountPercent(compareAt: NumLike, price: NumLike) {
    const oldP = toNumber(compareAt);
    const newP = toNumber(price);
    if (!oldP || !newP || oldP <= 0 || newP >= oldP) return undefined;
    return Math.round(((oldP - newP) / oldP) * 100);
}

const ShopMain: React.FC<Props> = ({ product }) => {
    if (!product) return undefined;

    const computedDiscount = useMemo(() => {
        return product.discountPercent ??
            deriveDiscountPercent(product.compareAtPrice, product.price);
    }, [product]);

    const img =
        product?.image?.startsWith('http') || product?.image?.startsWith('/')
            ? product.image
            : `/assets/images/grocery/${product?.image}`;
    
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

    const { addToCart } = useCart();
    const { addToWishlist } = useWishlist();

    const safeTitle = product?.title ?? 'Default Product Title';
    const safePrice = toNumber(product?.price) ?? 0;

    const currentPriceNum = useMemo(() => {
        const raw = product.price ?? 0;
        return typeof raw === "number" ? raw : parseFloat(String(raw).replace(/[^0-9.]/g, "") || "0");
    }, [product.price]);

    const compareAt = useMemo(() => {
        if (product.compareAtPrice !== undefined && product.compareAtPrice !== null) {
            const n =
                typeof product.compareAtPrice === "number"
                    ? product.compareAtPrice
                    : parseFloat(String(product.compareAtPrice).replace(/[^0-9.]/g, "") || "0");
            return n;
        }
        if (product.discountPercent && product.discountPercent > 0 && product.discountPercent < 100 && currentPriceNum > 0) {
            return currentPriceNum / (1 - product.discountPercent / 100);
        }
        return undefined;
    }, [product.compareAtPrice, product.discountPercent, currentPriceNum]);

    const showPrevious = typeof compareAt === "number" && compareAt > currentPriceNum;

    const handleAddToCart = () => {
        addToCart({
            id: product.id,
            image: img,
            title: safeTitle,
            price: safePrice,
            quantity: qty,
            active: true,
            product,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
    };

    const handleWishlist = () => {
        addToWishlist({
            id: product.id,
            image: img,
            title: safeTitle,
            price: safePrice,
            quantity: 1,
        });
    };

    useEffect(() => {
        const handleQuantityClick = (e: Event) => {
            const button = e.currentTarget as HTMLElement;
            const parent = button.closest('.quantity-edit') as HTMLElement | null;
            if (!parent) return;

            const input = parent.querySelector('.input') as HTMLInputElement | null;
            const addBtn = parent.querySelector('a.add-to-card') as HTMLElement | null;
            if (!input) return;

            const oldValue = parseInt(input.value || '1', 10);
            const newVal = button.classList.contains('plus')
                ? oldValue + 1
                : Math.max(1, oldValue - 1);

            input.value = String(newVal);
            if (addBtn) addBtn.setAttribute('data-quantity', String(newVal));
        };

        const buttons = document.querySelectorAll('.quantity-edit .button');
        buttons.forEach((b) => {
            b.removeEventListener('click', handleQuantityClick);
            b.addEventListener('click', handleQuantityClick);
        });

        return () => buttons.forEach((b) => b.removeEventListener('click', handleQuantityClick));
    }, []);


    return (
        <>
            <div className="image-and-action-area-wrapper">
                <Link href={`/shop/${product.slug}`} className="thumbnail-preview">
                    {computedDiscount !== undefined && (
                        <div className="badge">
                            <span>
                                {computedDiscount}% <br />
                                Off
                            </span>
                            <i className="fa-solid fa-bookmark" />
                        </div>
                    )}
                    <img src={img} alt={safeTitle} />
                </Link>

                <div className="action-share-option">
                    <span
                        className="single-action openuptip message-show-action"
                        data-flow="up"
                        title="Add To Wishlist"
                        onClick={handleWishlist}
                    >
                        <i className="fa-light fa-heart" />
                    </span>

                    <span
                        className="single-action openuptip cta-quickview product-details-popup-btn"
                        data-flow="up"
                        title="Quick View"
                        onClick={() => setIsQuickViewOpen(true)}
                    >
                        <i className="fa-regular fa-eye" />
                    </span>
                </div>
            </div>

            <div className="body-content">
                <Link href={`/shop/${product.slug}`}>
                    <h4 className="title">{safeTitle}</h4>
                </Link>
                {product.unitLabel && <span className="availability">{product.unitLabel}</span>}

                <div className="price-area">
                    <span className="current">{formatPrice(product.price)}</span>
                    {showPrevious && <div className="previous">{formatPrice(compareAt)}</div>}
                </div>

                <div className="cart-counter-action">
                    <div className="quantity-edit">
                        <input
                            type="text"
                            className="input"
                            value={qty}
                            onChange={(e) => {
                                const v = parseInt(e.target.value.replace(/\D/g, "") || "1", 10);
                                setQty(isNaN(v) || v < 1 ? 1 : v);
                            }}
                        />
                        <div className="button-wrapper-action">
                            <button className="button minus" onClick={() => setQty((q) => (q > 1 ? q - 1 : 1))}>
                                <i className="fa-regular fa-chevron-down" />
                            </button>
                            <button className="button plus" onClick={() => setQty((q) => q + 1)}>
                                +<i className="fa-regular fa-chevron-up" />
                            </button>
                        </div>
                    </div>

                    <a
                        href="#"
                        className="rts-btn btn-primary radious-sm with-icon add-to-cart"
                        onClick={(e) => {
                            e.preventDefault();
                            handleAddToCart();
                        }}
                    >
                        <div className="btn-text">{added ? "Added" : "Add"}</div>
                        <div className="arrow-icon">
                            <i className={`fa-regular ${added ? "fa-check" : "fa-cart-shopping"}`} />
                        </div>
                        <div className="arrow-icon">
                            <i className={`fa-regular ${added ? "fa-check" : "fa-cart-shopping"}`} />
                        </div>
                    </a>
                </div>
            </div>

            <ProductDetails
                show={isQuickViewOpen}
                handleClose={() => setIsQuickViewOpen(false)}
                product={{
                    ...product,
                    image: img,
                }}
            />
        </>
    );
};

export default ShopMain;
