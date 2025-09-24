"use client";

import { useEffect, useMemo, useState } from "react";
import HeaderOne from "@/components/header/HeaderOne";
import RelatedProduct from "@/components/product/RelatedProduct";
import FooterOne from "@/components/footer/FooterOne";
import LocalProducts from "@/data/Product.json";
import { useParams } from "next/navigation";
import { useCart } from "@/components/header/CartContext";
import type { ProductItem } from "@/types/content";

// ---- helpers ----
const API_BASE =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

// match your resolver rule everywhere
function resolveProductImage(src?: string): string {
  const fallback = "/assets/images/grocery/placeholder.png";
  if (!src) return fallback;
  const s = src.trim();
  if (/^https?:\/\//i.test(s) || /^\/\//.test(s) || s.startsWith("/")) return s;
  const cleaned = s.replace(/^\.?\//, "");
  if (/^(assets|images)\//i.test(cleaned)) return `/${cleaned}`;
  return `/assets/images/grocery/${cleaned}`;
}

// small price formatter
function toNumber(p?: number | string) {
  return typeof p === "number" ? p : parseFloat(String(p ?? "0").replace(/[^0-9.]/g, "")) || 0;
}
function money(p?: number | string) {
  return `$${toNumber(p).toFixed(2)}`;
}

const ProductSlugPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const [product, setProduct] = useState<ProductItem | null>(null);
  const [loading, setLoading] = useState(true);

  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);

  // fetch detail by slug with fallback to local JSON
  useEffect(() => {
    let mounted = true;

    async function fetchDetail() {
      setLoading(true);
      try {
        // Try API detail endpoint
        if (API_BASE) {
          // Adjust the path to your DRF detail route if different:
          // e.g. /products/<slug>/ or /products/detail/?slug=<slug>
          const res = await fetch(`${API_BASE}/products/${slug}/`, {
            next: { revalidate: 60 },
          });
          if (res.ok) {
            const data = (await res.json()) as any;
            const normalized: ProductItem = {
              slug: String(data?.slug ?? slug),
              image: data?.image ?? data?.image_url ?? data?.imageUrl ?? "",
              title: data?.title ?? data?.name ?? "",
              price: data?.price,
              compareAtPrice: data?.compareAtPrice ?? data?.compare_at_price,
              unitLabel: data?.unitLabel ?? data?.unit_label ?? "500g Pack",
              discountPercent:
                typeof data?.discountPercent === "number"
                  ? data.discountPercent
                  : data?.discount_percent,
              category: data?.category ?? data?.category_name ?? data?.category?.name,
              sku: data?.sku,
              description: data?.description,
            };
            if (mounted) {
              setProduct(normalized);
              setLoading(false);
              return;
            }
          }
        }
      } catch {
        // ignore and fall back
      }

      // Fallback: find in local JSON by slug
      const local = (LocalProducts as any[]).find((p) => p?.slug === slug);
      if (mounted) {
        setProduct(
          local
            ? {
                slug: String(local.slug),
                image: local.image ?? local.bannerImg, // support your old key
                title: local.title ?? local.name ?? "",
                price: local.price,
                compareAtPrice: local.compareAtPrice,
                unitLabel: local.unitLabel ?? "500g Pack",
                discountPercent: local.discountPercent,
                category: local.category,
                sku: local.sku,
                description: local.description,
              }
            : null
        );
        setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const currentPrice = useMemo(() => toNumber(product?.price), [product]);
  const compareAt = useMemo(() => {
    if (!product) return undefined;
    if (product.compareAtPrice != null) return toNumber(product.compareAtPrice);
    if (product.discountPercent && product.discountPercent > 0 && product.discountPercent < 100 && currentPrice > 0) {
      return currentPrice / (1 - product.discountPercent / 100);
    }
    return undefined;
  }, [product, currentPrice]);

  const showPrev = typeof compareAt === "number" && compareAt > currentPrice;

  const handleAdd = () => {
    if (!product) return;
    addToCart({
      id: product.sku ?? product.slug,
      image: resolveProductImage(product.image),
      title: product.title ?? "Product",
      price: currentPrice,
      quantity: 1,
      active: true,
      sku: product.sku,
      slug: product.slug,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  // UI pieces derived from product
  const title = product?.title ?? "Product";
  const unitLabel = product?.unitLabel ?? "500g Pack";
  const mainImage = resolveProductImage(product?.image);

  return (
    <div>
      <HeaderOne />

      {/* breadcrumb */}
      <div className="rts-navigation-area-breadcrumb bg_light-1">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="navigator-breadcrumb-wrapper">
                <a href="/">Home</a>
                <i className="fa-regular fa-chevron-right" />
                <a className="current" href="#">Product Details</a>
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

      <div className="rts-chop-details-area rts-section-gap bg_light-1">
        <div className="container">
          <div className="shopdetails-style-1-wrapper">
            <div className="row g-5">
              {/* MAIN COLUMN ONLY (right sidebar removed per your request) */}
              <div className="col-xl-8 col-lg-8 col-md-12">
                <div className="product-details-popup-wrapper in-shopdetails">
                  <div className="rts-product-details-section rts-product-details-section2 product-details-popup-section">
                    <div className="product-details-popup">
                      {loading ? (
                        <div className="text-center py-5"><h3>Loading...</h3></div>
                      ) : !product ? (
                        <div className="text-center py-5"><h3>Product not found</h3></div>
                      ) : (
                        <div className="details-product-area">
                          {/* left: main image */}
                          <div className="product-thumb-area">
                            <div className="cursor" />
                            <div className="thumb-wrapper one filterd-items figure">
                              <div className="product-thumb">
                                <img src={mainImage} alt={title} />
                              </div>
                            </div>

                            {/* single thumbnail strip retained for style; shows main image */}
                            <div className="product-thumb-filter-group">
                              <div className={`thumb-filter filter-btn active`} style={{ cursor: "pointer" }}>
                                <img src={mainImage} alt={title} />
                              </div>
                            </div>
                          </div>

                          {/* right: content */}
                          <div className="contents">
                            <div className="product-status">
                              <span className="product-catagory">{product.category ?? "Grocery"}</span>
                              {/* rating/review block removed */}
                            </div>

                            <h2 className="product-title">{title}</h2>

                            {product.description && (
                              <p className="mt--20 mb--20">{product.description}</p>
                            )}

                            <span
                              className="product-price mb--15 d-block"
                              style={{ color: "#DC2626", fontWeight: 600 }}
                            >
                              {money(product.price)}
                              {showPrev && <span className="old-price ml--15">{money(compareAt)}</span>}
                            </span>

                            <div className="product-bottom-action">
                              <a
                                href="#"
                                className="rts-btn btn-primary radious-sm with-icon"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleAdd();
                                }}
                              >
                                <div className="btn-text">{added ? "Added" : "Add to Cart"}</div>
                                <div className="arrow-icon"><i className="fa-regular fa-cart-shopping" /></div>
                                <div className="arrow-icon"><i className="fa-regular fa-cart-shopping" /></div>
                              </a>
                            </div>

                            <div className="product-uniques">
                              {product.sku && (
                                <span className="sku product-unipue mb--10">
                                  <strong>SKU:</strong> {product.sku}
                                </span>
                              )}
                              {product.category && (
                                <span className="tags product-unipue mb--10">
                                  <strong>Category:</strong> {product.category}
                                </span>
                              )}
                              {unitLabel && (
                                <span className="tags product-unipue mb--10">
                                  <strong>Unit:</strong> {unitLabel}
                                </span>
                              )}
                            </div>

                            {/* wishlist row kept (compare/share removed) */}
                            <div className="share-option-shop-details">
                              <div className="single-share-option">
                                <div className="icon"><i className="fa-regular fa-heart" /></div>
                                <span>Add To Wishlist</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tabs: keep ONLY "Additional Information" */}
                <div className="product-discription-tab-shop mt--50">
                  <ul className="nav nav-tabs" id="myTab" role="tablist">
                    <li className="nav-item" role="presentation">
                      <button className="nav-link active">Additional Information</button>
                    </li>
                  </ul>

                  <div className="tab-content" id="myTabContent">
                    <div>
                      <div className="single-tab-content-shop-details">
                        {/* Put any structured info you have about the product here. 
                            For now, mirrors your previous table markup but you can bind real fields. */}
                        <div className="table-responsive table-shop-details-pd">
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Field</th>
                                <th>Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {product?.title && (
                                <tr><td>Title</td><td>{product.title}</td></tr>
                              )}
                              {product?.category && (
                                <tr><td>Category</td><td>{product.category}</td></tr>
                              )}
                              {product?.sku && (
                                <tr><td>SKU</td><td>{product.sku}</td></tr>
                              )}
                              {product?.unitLabel && (
                                <tr><td>Unit</td><td>{product.unitLabel}</td></tr>
                              )}
                              {typeof product?.discountPercent === "number" && (
                                <tr><td>Discount</td><td>{product.discountPercent}%</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>

                        {product?.description && (
                          <p className="note mt--20">
                            <span>Description:</span> {product.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDEBAR REMOVED:
                  - Available offers
                  - Guaranteed Safe Checkout
              */}
            </div>
          </div>
        </div>
      </div>

      <RelatedProduct />
      <FooterOne />
    </div>
  );
};

export default ProductSlugPage;
