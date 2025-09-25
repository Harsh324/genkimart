'use client';

import React, { useMemo } from 'react';
import { useWishlist } from '@/components/header/WishlistContext';
import { useCart } from '@/components/header/CartContext';
import type { ProductItem } from '@/types/content';

const FREE_SHIPPING_THRESHOLD = 59.69;

const money = (n: number, locale = 'ja-JP', currency = 'JPY') =>
	new Intl.NumberFormat(locale, { style: 'currency', currency }).format(n);

const WishlistMain: React.FC = () => {
	const { items, remove, updateQuantity, clear, isLoaded } = useWishlist(); // items: { product, quantity }
	const { add: addToCart } = useCart();

	// derived totals
	const subtotal = useMemo(
		() =>
			items.reduce((acc, it) => {
				const price =
					typeof it.product.price === 'number'
						? it.product.price
						: Number(it.product.price ?? 0) || 0; // normalized already, but safe-cast
				return acc + price * it.quantity;
			}, 0),
		[items]
	);
	const itemCount = useMemo(
		() => items.reduce((sum, it) => sum + it.quantity, 0),
		[items]
	);

	const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
	const progressPct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));

	const handleAddToCart = (product: ProductItem, quantity: number) => {
		addToCart({ product, quantity, active: true });
	};

	const clearAll = () => clear();

	return (
		<div className="rts-cart-area rts-section-gap bg_light-1">
			<div className="container">
				<div className="row g-5">
					<div className="col-xl-12 col-12 order-2 order-xl-1">
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
								<div className="subtotal"><p>Add to Cart</p></div>
							</div>

							{items.length === 0 && isLoaded && (
								<div className="single-cart-area-list main item-parent">
									<div className="col-12">
										<p>Your wishlist is empty.</p>
									</div>
								</div>
							)}

							{items.map(({ product, quantity }) => {
								const id = (product.id ?? product.slug) as string | number;
								const unitPrice =
									typeof product.price === 'number'
										? product.price
										: Number(product.price ?? 0) || 0;
								return (
									<div className="single-cart-area-list main item-parent" key={String(id)}>
										<div className="product-main-cart">
											<div
												className="close section-activation"
												onClick={() => remove(id)}
												role="button"
												aria-label="Remove from wishlist"
												title="Remove"
												tabIndex={0}
												onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && remove(id)}
											>
												<i className="fa-regular fa-x" />
											</div>

											<div className="thumbnail">
												<img src={product.image} alt={product.title || 'product'} />
											</div>

											<div className="information">
												<h6 className="title">{product.title ?? 'Product'}</h6>
												<span>SKU: {product.sku ?? '—'}</span>
											</div>
										</div>

										<div className="price"><p>{money(unitPrice)}</p></div>

										<div className="quantity">
											<div className="quantity-edit">
												{/* Display-only: wishlist quantity is managed via +/- */}
												<input type="text" className="input" value={quantity} readOnly />
												<div className="button-wrapper-action">
													<button
														type="button"
														className="button minus"
														onClick={() => updateQuantity(id, Math.max(1, quantity - 1))}
														aria-label="Decrease quantity"
													>
														<i className="fa-regular fa-chevron-down" />
													</button>
													<button
														type="button"
														className="button plus"
														onClick={() => updateQuantity(id, quantity + 1)}
														aria-label="Increase quantity"
													>
														<i className="fa-regular fa-chevron-up" />
													</button>
												</div>
											</div>
										</div>

										<div className="subtotal">
											<p>{money(unitPrice * quantity)}</p>
										</div>

										<div className="button-area">
											<button
												type="button"
												className="rts-btn btn-primary radious-sm with-icon"
												onClick={() => handleAddToCart(product, quantity)}
											>
												<div className="btn-text">Add to Cart</div>
												<div className="arrow-icon"><i className="fa-regular fa-cart-shopping" /></div>
												<div className="arrow-icon"><i className="fa-regular fa-cart-shopping" /></div>
											</button>
										</div>
									</div>
								);
							})}
							<div
								className="bottom-cupon-code-cart-area"
								style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}
							>
								<div
									className="rts-btn btn-primary radious-sm with-icon"
									role="status"
									aria-live="polite"
									tabIndex={-1}
								>
									<div className="btn-text">
										Subtotal{itemCount ? ` (${itemCount} ${itemCount === 1 ? 'item' : 'items'})` : ''}
									</div>
									<div className="arrow-icon"><strong>{money(subtotal)}</strong></div>
									<div className="arrow-icon" aria-hidden="true"><i className="fa-regular fa-wallet" /></div>
								</div>

								<button onClick={clearAll} className="rts-btn btn-primary">Clear All</button>
							</div>


						</div>
					</div>

				</div>
			</div>
		</div>
	);
};

export default WishlistMain;
