'use client';

import { useState } from "react";
import Modal from "react-bootstrap/Modal";
import { useCart } from "@/components/header/CartContext";
import type { ProductItem } from "@/types/content";

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

// Extend your ProductItem with a few optional UI-only fields
type ViewProduct = ProductItem & {
    categories?: string[];
    tags?: string[];
    gallery?: string[]; // extra images for thumbs
};

type Props = {
    show: boolean;
    handleClose: () => void;
    product: ViewProduct;
};

const ProductDetails: React.FC<Props> = ({ show, handleClose, product }) => {
    if (!product) return undefined;

    const thumbs = product.gallery?.length
        ? product.gallery
        : [product.image, product.image, product.image];

    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<number>(0);
    const { addToCart } = useCart();

    const increaseQuantity = () => setQuantity((q) => q + 1);
    const decreaseQuantity = () => setQuantity((q) => (q > 1 ? q - 1 : 1));

    const totalPrice = product.price * quantity;

    const handleAdd = () => {
        addToCart({
            quantity,
            active: true,
            product,
        });
    };

    return (
        <Modal
            show={show}
            onHide={handleClose}
            backdrop="static"
            keyboard={false}
            dialogClassName="modal-compare"
        >
            <div className="product-details-popup-wrapper popup">
                <div className="rts-product-details-section rts-product-details-section2 product-details-popup-section">
                    <div className="product-details-popup">
                        <button className="product-details-close-btn" onClick={handleClose}>
                            <i className="fal fa-times" />
                        </button>

                        <div className="details-product-area">
                            {/* Left: images */}
                            <div className="product-thumb-area">
                                <div className="cursor" />
                                <div className="thumb-wrapper one filterd-items figure">
                                    <div className="product-thumb zoom">
                                        {/* active image */}
                                        <img src={thumbs[activeTab]} alt="product-thumb" />
                                        {product.discountPercent !== undefined && (
                                            <div className="badge">
                                                <span>
                                                    {product.discountPercent}% <br /> Off
                                                </span>
                                                <i className="fa-solid fa-bookmark" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="product-thumb-filter-group">
                                    {thumbs.map((src, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setActiveTab(idx)}
                                            className={`thumb-filter filter-btn ${activeTab === idx ? "active" : ""}`}
                                        >
                                            <img src={src} alt={`thumb-${idx}`} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right: content */}
                            <div className="contents">
                                <div className="product-status">
                                    {product.categories?.length ? (
                                        <span className="product-catagory">{product.categories[0]}</span>
                                    ) : null}
                                </div>

                                <h2 className="product-title">
                                    {product.title ?? "Default Product Title"}{" "}
                                    <span className="stock">In Stock</span>
                                </h2>

                                <span className="product-price">
                                    {product.compareAtPrice !== undefined && (
                                        <span className="old-price">{formatPrice(product.compareAtPrice)}</span>
                                    )}{" "}
                                    {formatPrice(totalPrice)}
                                </span>

                                {product.unitLabel && (
                                    <p className="mt-2"><strong>Unit:</strong> {product.unitLabel}</p>
                                )}
                                {product.description && <p>{product.description}</p>}

                                <div className="product-bottom-action">
                                    <div className="cart-edit">
                                        <div className="quantity-edit action-item">
                                            <button className="button" onClick={decreaseQuantity}>
                                                <i className="fal fa-minus minus" />
                                            </button>
                                            <input type="text" className="input" value={quantity} readOnly />
                                            <button className="button plus" onClick={increaseQuantity}>
                                                <i className="fal fa-plus plus" />
                                            </button>
                                        </div>
                                    </div>

                                    <a
                                        href="#"
                                        className="rts-btn btn-primary radious-sm with-icon"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleAdd();
                                        }}
                                    >
                                        <div className="btn-text">Add To Cart</div>
                                        <div className="arrow-icon">
                                            <i className="fa-regular fa-cart-shopping" />
                                        </div>
                                        <div className="arrow-icon">
                                            <i className="fa-regular fa-cart-shopping" />
                                        </div>
                                    </a>

                                    {/* Keep wishlist icon if you later wire it up */}
                                    <a href="#" className="rts-btn btn-primary ml--20" onClick={(e)=>e.preventDefault()}>
                                        <i className="fa-light fa-heart" />
                                    </a>
                                </div>

                                <div className="product-uniques">
                                    {product.sku && (
                                        <span className="sku product-unipue"><span>SKU: </span> {product.sku}</span>
                                    )}
                                    {product.categories?.length ? (
                                        <span className="catagorys product-unipue">
                                        <span>Categories: </span> {product.categories.join(", ")}
                                        </span>
                                    ) : null}
                                    {product.tags?.length ? (
                                        <span className="tags product-unipue">
                                        <span>Tags: </span> {product.tags.join(", ")}
                                        </span>
                                    ) : null}
                                </div>

                                {/* <div className="share-social">
                                <span>Share:</span>
                                <a className="platform" href="http://facebook.com" target="_blank"><i className="fab fa-facebook-f" /></a>
                                <a className="platform" href="http://twitter.com" target="_blank"><i className="fab fa-twitter" /></a>
                                <a className="platform" href="http://behance.com" target="_blank"><i className="fab fa-behance" /></a>
                                <a className="platform" href="http://youtube.com" target="_blank"><i className="fab fa-youtube" /></a>
                                <a className="platform" href="http://linkedin.com" target="_blank"><i className="fab fa-linkedin" /></a>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>      
        </Modal>
    );
};

export default ProductDetails;
