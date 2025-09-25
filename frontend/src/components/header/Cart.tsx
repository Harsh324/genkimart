'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/header/CartContext'; // adjust path if needed

// Keep these consistent with your other components
const FREE_SHIPPING_THRESHOLD = 59.69;
const money = (n: number, locale = 'ja-JP', currency = 'JPY') =>
	new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);
const toPrice = (p: unknown) => (typeof p === 'number' ? p : Number(p ?? 0) || 0);

const CartDropdown: React.FC = () => {
	const { items, remove, isLoaded } = useCart();

	// Sum quantities for the badge (feel free to switch to items.length if you prefer)
	const itemCount = useMemo(
		() => items.reduce((sum, it) => sum + it.quantity, 0),
		[items]
	);

	const subtotal = useMemo(
		() => items.reduce((sum, it) => sum + toPrice(it.product.price) * it.quantity, 0),
		[items]
	);

	const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
	const progressPct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

	return (
		<div className="btn-border-only cart category-hover-header">
			<i className="fa-sharp fa-regular fa-cart-shopping" />
			<span className="text">Cart</span>

			{/* Avoid hydration flicker */}
			<span className="number" suppressHydrationWarning>
				{isLoaded ? itemCount : 0}
			</span>

			<div className="category-sub-menu card-number-show">
				<h5 className="shopping-cart-number">
					Shopping Cart ({String(isLoaded ? itemCount : 0)})
				</h5>

				{/* Items */}
				{isLoaded && items.length > 0 ? (
					items.map(({ product, quantity }, idx) => {
						const id = product.id ?? product.slug;
						const lineTotal = toPrice(product.price) * quantity;

						return (
							<div key={`${String(id)}::${idx}`} className="cart-item-1 border-top">
								<div className="img-name">

									<div className="close section-activation" onClick={() => remove(id as any)}>
										<i className="fa-regular fa-x" />
									</div>

									<div className="thumbanil">
										<Image
											src={product.image}
											alt={product.title ?? 'product'}
											width={60}
											height={60}
										/>
									</div>

									<div className="details">
										<Link href={`/shop/${product.slug}`}>
											<h5 className="title">{product.title ?? 'Product'}</h5>
										</Link>
										<div className="number">
											{quantity} <i className="fa-regular fa-x" />
											<span>{money(lineTotal)}</span>
										</div>
									</div>
								</div>
							</div>
						);
					})
				) : (
					isLoaded && (
						<div className="cart-item-1 border-top">
							<div className="img-name">
								<div className="details">
									<p>Your cart is empty.</p>
								</div>
							</div>
						</div>
					)
				)}

				{/* Totals + progress */}
				<div className="sub-total-cart-balance">
					<div className="bottom-content-deals mt--10">
						<div className="top">
							<span>Sub Total:</span>
							<span className="number-c" suppressHydrationWarning>
								{money(subtotal)}
							</span>
						</div>
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
						{remaining > 0 ? (
							<p>
								Spend More <span>{money(remaining)}</span> to reach <span>Free Shipping</span>
							</p>
						) : (
							<p><strong>You unlocked free shipping!</strong></p>
						)}
					</div>

					<div className="button-wrapper d-flex align-items-center justify-content-between">
						<Link href="/cart" className="rts-btn btn-primary">
							View Cart
						</Link>
						<Link href="/checkout" className="rts-btn btn-primary border-only">
							CheckOut
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

export default CartDropdown;
