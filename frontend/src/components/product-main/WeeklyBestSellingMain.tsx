'use client';

import { useState, useEffect, useMemo } from 'react';
import ProductDetails from "@/components/modal/ProductDetails";
import { useCart } from "@/components/header/CartContext";
import { useWishlist } from "@/components/header/WishlistContext";
import { toast } from 'react-toastify';
import type { ProductItem } from "@/types/content";

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

type WeeklyBestSellingMainProps = { product: ProductItem };

const WeeklyBestSellingMain: React.FC<WeeklyBestSellingMainProps> = ({ product }) => {
    if (!product) return undefined;
    const computedDiscount = useMemo(() => {
        return product.discountPercent ??
            deriveDiscountPercent(product.compareAtPrice, product.price);
    }, [product]);

    const imgSrc =
        product?.image?.startsWith('http') || product?.image?.startsWith('/')
            ? product.image
            : `/assets/images/grocery/${product?.image}`;

    const { addToCart } = useCart();
    const { addToWishlist } = useWishlist();
    const [added, setAdded] = useState(false);
    const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
    const [qty, setQty] = useState<number>(1);

    const safeTitle = product?.title ?? 'Default Product Title';
    const safePrice = toNumber(product?.price) ?? 0;

    const handleAdd = () => {
        addToCart({
            id: product.id,
            image: imgSrc,
            title: safeTitle,
            price: safePrice,
            quantity: qty,
            active: true,
            // (optional) keep the raw product for later use in cart line
            product,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 5000);
    };

    const handleWishlist = () =>
        addToWishlist({
            id: product.id,
            image: imgSrc,
            title: safeTitle,
            price: safePrice,
            quantity: 1,
            // (optional) include product
            product,
        });

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
                <a href={`/shop/${product.slug}`} className="thumbnail-preview">
                    {computedDiscount !== undefined && (
                        <div className="badge">
                            <span>
                                {computedDiscount}% <br />
                                Off
                            </span>
                            <i className="fa-solid fa-bookmark" />
                        </div>
                    )}
                    <img src={imgSrc} alt={safeTitle} />
                </a>

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
                <a href={`/shop/${product.slug}`}>
                    <h4 className="title">{safeTitle}</h4>
                </a>

                {product.unitLabel && <span className="availability">{product.unitLabel}</span>}

                <div className="price-area">
                    <span className="current">{formatPrice(product.price)}</span>
                    {product.compareAtPrice !== undefined && (
                        <div className="previous">{formatPrice(product.compareAtPrice)}</div>
                    )}
                </div>

                <div className="cart-counter-action">
                    <div className="quantity-edit">
                        <input
                            type="text"
                            className="input"
                            value={qty}
                            onChange={(e) => {
                                const v = parseInt(e.target.value || '1', 10);
                                setQty(Number.isFinite(v) && v > 0 ? v : 1);
                            }}
                        />
                        <div className="button-wrapper-action">
                            <button className="button minus" onClick={() => setQty((q) => Math.max(1, q - 1))}>
                                <i className="fa-regular fa-chevron-down" />
                            </button>
                            <button className="button plus" onClick={() => setQty((q) => q + 1)}>
                                +<i className="fa-regular fa-chevron-up" />
                            </button>
                        </div>
                    </div>

                    <a
                        href="#"
                        className="rts-btn btn-primary add-to-card radious-sm with-icon"
                        onClick={(e) => {
                            e.preventDefault();
                            handleAdd();
                        }}
                    >
                        <div className="btn-text">{added ? 'Added' : 'Add'}</div>
                        <div className="arrow-icon">
                            <i className={added ? 'fa-solid fa-check' : 'fa-regular fa-cart-shopping'} />
                        </div>
                        <div className="arrow-icon">
                            <i className={added ? 'fa-solid fa-check' : 'fa-regular fa-cart-shopping'} />
                        </div>
                    </a>
                </div>
            </div>

            <ProductDetails
                show={isQuickViewOpen}
                handleClose={() => setIsQuickViewOpen(false)}
                product={{
                    ...product,
                    // ensure image is the resolved absolute path you display in the card
                    image: imgSrc,
                    // make sure number-like fields are numbers if ProductDetails expects numbers
                    price: safePrice,
                    compareAtPrice: toNumber(product.compareAtPrice),
                    discountPercent: computedDiscount,
                }}
            />
        </>
    );
};

export default WeeklyBestSellingMain;
