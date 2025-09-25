'use client';

import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductDetails from '@/components/modal/ProductDetails';
import { useCart } from '@/components/header/CartContext';
import { useWishlist } from '@/components/header/WishlistContext';
import type { ProductItem } from '@/types/content';

type NumLike = string | number | undefined;

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' });
const toNumber = (n: NumLike) => {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  return Number.isFinite(v as number) ? (v as number) : undefined;
};
const formatPrice = (n: NumLike) => {
  const num = toNumber(n);
  return num === undefined ? '' : yen.format(num);
};
const deriveDiscountPercent = (compareAt: NumLike, price: NumLike) => {
  const oldP = toNumber(compareAt);
  const newP = toNumber(price);
  if (!oldP || !newP || oldP <= 0 || newP >= oldP) return undefined;
  return Math.round(((oldP - newP) / oldP) * 100);
};

type Props = { product: ProductItem };

const WeeklyBestSellingMain: React.FC<Props> = ({ product }) => {
  if (!product) return null;

  const computedDiscount = useMemo(
    () => product.discountPercent ?? deriveDiscountPercent(product.compareAtPrice, product.price),
    [product]
  );

//   const { add: addToCart } = useCart();
  const { add: addCartItem } = useCart();
  const { items: wishlistItems, add: addWish, remove: removeWish, isLoaded } = useWishlist();

  const [added, setAdded] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [qty, setQty] = useState<number>(1);

  const inputRef = useRef<HTMLInputElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // mount gate to avoid SSR/hydration drift (particularly with Swiper)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const setQtyDom = useCallback((next: number) => {
    const v = Number.isFinite(next) && next > 0 ? Math.floor(next) : 1;
    setQty(v);
    const inp = inputRef.current;
    if (inp) {
      inp.value = String(v);
      inp.setAttribute('value', String(v));
    }
    if (addBtnRef.current) {
      addBtnRef.current.setAttribute('data-quantity', String(v));
    }
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const n = parseInt(e.currentTarget.value || '1', 10);
    setQtyDom(n);
  };

  const dec = () => setQtyDom(qty - 1);
  const inc = () => setQtyDom(qty + 1);

  const safeTitle = product.title ?? 'Default Product Title';
  const safePrice = toNumber(product.price) ?? 0;

  const normalizedProduct = useMemo(
    () => ({
      ...product,
      price: safePrice,
      compareAtPrice: toNumber(product.compareAtPrice),
      discountPercent: computedDiscount,
    }),
    [product, safePrice, computedDiscount]
  );

  // —— Wishlist integration (compare by STRING to avoid 2 vs "2" issues)
  const pid = String(product.id ?? product.slug);

  // only compute after both mounted + context loaded; force a small remount when ready
  const ready = mounted && isLoaded;
  const inWishlist = ready && wishlistItems.some(
    (e) => String(e.product.id ?? e.product.slug) === pid
  );

  const toggleWishlist = useCallback(() => {
    if (!ready) return; // guard clicks pre-ready
    if (inWishlist) removeWish(pid);
    else addWish(normalizedProduct, 1);
  }, [ready, inWishlist, pid, addWish, removeWish, normalizedProduct]);

  // —— Cart
//   const handleAddToCart = useCallback(() => {
//     addToCart({ product: normalizedProduct, quantity: qty, active: true });
//     setAdded(true);
//     timeoutRef.current = setTimeout(() => setAdded(false), 1500);
//   }, [addToCart, normalizedProduct, qty]);

  const handleAddToCart = useCallback(() => {
    addCartItem(normalizedProduct, qty);
    setAdded(true);
    const t = setTimeout(() => setAdded(false), 1500);
    }, [addCartItem, normalizedProduct, qty]);

  return (
    <>
      <div className="image-and-action-area-wrapper">
        <Link href={`/shop/${product.slug}`} className="thumbnail-preview">
          {computedDiscount !== undefined && (
            <div className="badge" aria-label={`${computedDiscount}% off`}>
              <span>
                {computedDiscount}% <br />
                Off
              </span>
              <i className="fa-solid fa-bookmark" />
            </div>
          )}
          <Image src={product.image} alt={safeTitle} width={320} height={320} />
        </Link>

        <div className="action-share-option">
          {/* force remount when 'ready' flips so React gets a fresh node unaffected by Swiper */}
          <button
            key={ready ? 'heart-ready' : 'heart-loading'}
            type="button"
            className="single-action openuptip message-show-action"
            data-flow="up"
            title={ready && inWishlist ? 'Remove from Wishlist' : 'Add To Wishlist'}
            aria-pressed={ready ? !!inWishlist : false}
            onClick={toggleWishlist}
            // keep hydration calm if attributes differ after mount
            suppressHydrationWarning
            // optional: disable before ready to avoid confusing clicks
            disabled={!ready}
          >
            <i
              className={ready && inWishlist ? 'fa-solid fa-heart' : 'fa-light fa-heart'}
              suppressHydrationWarning
            />
          </button>

          <button
            type="button"
            className="single-action openuptip cta-quickview product-details-popup-btn"
            data-flow="up"
            title="Quick View"
            onClick={() => setIsQuickViewOpen(true)}
          >
            <i className="fa-regular fa-eye" />
          </button>
        </div>
      </div>

      <div className="body-content">
        <Link href={`/shop/${product.slug}`} className="title-link">
          <h4 className="title">{safeTitle}</h4>
        </Link>

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
              ref={inputRef}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              className="input"
              defaultValue={qty}
              onChange={onInputChange}
            />
            <div className="button-wrapper-action">
              <button type="button" className="button minus" onClick={dec}>
                <i className="fa-regular fa-chevron-down" />
              </button>
              <button type="button" className="button plus" onClick={inc}>
                <i className="fa-regular fa-chevron-up" />
              </button>
            </div>
          </div>

          <button
            ref={addBtnRef}
            type="button"
            className="rts-btn btn-primary add-to-card radious-sm with-icon"
            data-quantity={qty}
            onClick={(e) => {
              e.preventDefault();
              handleAddToCart();
            }}
          >
            <div className="btn-text">{added ? 'Added' : 'Add'}</div>
            <div className="arrow-icon">
              <i className={added ? 'fa-solid fa-check' : 'fa-regular fa-cart-shopping'} />
            </div>
            <div className="arrow-icon">
              <i className={added ? 'fa-solid fa-check' : 'fa-regular fa-cart-shopping'} />
            </div>
          </button>
        </div>
      </div>

      <ProductDetails
        show={isQuickViewOpen}
        handleClose={() => setIsQuickViewOpen(false)}
        product={normalizedProduct}
      />
    </>
  );
};

export default WeeklyBestSellingMain;
