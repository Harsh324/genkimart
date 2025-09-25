'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/header/CartContext';

// Keep consistent with your wishlist mini header
const FREE_SHIPPING_THRESHOLD = 59.69;
const money = (n: number, locale = 'ja-JP', currency = 'JPY') =>
    new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);
const toPrice = (p: unknown) => (typeof p === 'number' ? p : Number(p ?? 0) || 0);

const CartMain: React.FC = () => {
    const { items, remove, updateQuantity, clear, isLoaded } = useCart();

    const subtotal = useMemo(
        () => (isLoaded ? items.reduce((sum, it) => sum + toPrice(it.product.price) * it.quantity, 0) : 0),
        [items, isLoaded]
    );

    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const progressPct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

    const onDec = (id: string | number, qty: number) => {
        if (qty > 1) updateQuantity(id as any, qty - 1);
    };
    const onInc = (id: string | number, qty: number) => {
        updateQuantity(id as any, qty + 1);
    };

    return (
        <div className="rts-cart-area rts-section-gap bg_light-1">
            <div className="container">
                <div className="row g-5">
                    {/* Cart Items */}
                    <div className="col-xl-9 col-12 order-2 order-xl-1">
                        <div className="cart-area-main-wrapper">
                            <div className="cart-top-area-note">
                                {remaining > 0 ? (
                                    <p>
                                        Add <span>{money(remaining)}</span> to cart and get free shipping
                                    </p>
                                ) : (
                                    <p><strong>You unlocked free shipping!</strong></p>
                                )}
                                <div className="bottom-content-deals mt--10">
                                    <div className="single-progress-area-incard">
                                        <div className="progress">
                                            <div
                                                className="progress-bar wow fadeInLeft"
                                                role="progressbar"
                                                style={{ width: `${progressPct}%` }}
                                                aria-valuenow={progressPct}
                                                aria-valuemin={0}
                                                aria-valuemax={100}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rts-cart-list-area">
                            <div className="single-cart-area-list head">
                                <div className="product-main"><p>Products</p></div>
                                <div className="price"><p>Price</p></div>
                                <div className="quantity"><p>Quantity</p></div>
                                <div className="subtotal"><p>SubTotal</p></div>
                            </div>

                            {/* Items */}
                            {isLoaded && items.length > 0 ? (
                                items.map(({ product, quantity }, idx) => {
                                    const id = product.id ?? product.slug;
                                    const unit = toPrice(product.price);
                                    const line = unit * quantity;

                                    return (
                                        <div className="single-cart-area-list main item-parent" key={`${String(id)}::${idx}`}>
                                            <div className="product-main-cart">

                                                <div
                                                    className="close section-activation"
                                                    onClick={() => remove(id as any)}
                                                    role="button"
                                                    aria-label="Remove from cart"
                                                    title="Remove"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && remove(id)}
                                                >
                                                    <i className="fa-regular fa-x" />
                                                </div>

                                                <div className="thumbnail">
                                                    <Image
                                                        src={product.image}
                                                        alt={product.title ?? 'product'}
                                                        width={80}
                                                        height={80}
                                                    />
                                                </div>

                                                <div className="information">
                                                    <Link href={`/shop/${product.slug}`}>
                                                        <h6 className="title">{product.title ?? 'Product'}</h6>
                                                        {product.sku && <span>SKU: {String(product.sku)}</span>}
                                                    </Link>

                                                </div>
                                            </div>

                                            <div className="price"><p>{money(unit)}</p></div>

                                            <div className="quantity">
                                                <div className="quantity-edit">
                                                    <input
                                                        type="text"
                                                        className="input"
                                                        value={quantity}
                                                        readOnly
                                                        aria-label="Quantity"
                                                    />
                                                    <div className="button-wrapper-action">
                                                        <button className="button minus" onClick={() => onDec(id as any, quantity)}>
                                                            <i className="fa-regular fa-chevron-down" />
                                                        </button>
                                                        <button className="button plus" onClick={() => onInc(id as any, quantity)}>
                                                            <i className="fa-regular fa-chevron-up" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="subtotal"><p>{money(line)}</p></div>
                                        </div>
                                    );
                                })
                            ) : (
                                isLoaded && (
                                    <div className="single-cart-area-list main item-parent">
                                        <div className="product-main-cart">
                                            <div className="information">
                                                <h6 className="title">Your cart is empty.</h6>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Clear cart */}
                            <div className="bottom-cupon-code-cart-area">
                                <button type="button" onClick={() => clear()} className="rts-btn btn-primary mr--50">
                                    Clear All
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Summary Area */}
                    <div className="col-xl-3 col-12 order-1 order-xl-2">
                        <div className="cart-total-area-start-right">
                            <h5 className="title">Cart Totals</h5>

                            <div className="subtotal">
                                <span>Subtotal</span>
                                <h6 className="price" suppressHydrationWarning>
                                    {money(subtotal)}
                                </h6>
                            </div>

                            {/* Shipping note (kept lightweight; adjust as needed) */}
                            <div className="shipping">
                                <span>Shipping</span>
                                <ul>
                                    <li><p>Shipping options are calculated at checkout.</p></li>
                                </ul>
                            </div>

                            <div className="bottom">
                                <div className="wrapper">
                                    <span>Total</span>
                                    <h6 className="price" suppressHydrationWarning>
                                        {money(subtotal)}
                                    </h6>
                                </div>
                                <div className="button-area">
                                    <button className="rts-btn btn-primary">Proceed To Checkout</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* /Summary */}
                </div>
            </div>
        </div>
    );
};

export default CartMain;
