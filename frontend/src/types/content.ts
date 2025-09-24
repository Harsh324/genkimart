export type BannerItem = {
    id: string | number;
    headline: string;        // e.g., "Do not miss our amazing grocery deals"
    subtext?: string;        // e.g., "Get up to 30% off on your first $150 purchase"
    ctaText?: string;        // e.g., "Shop Now"
    ctaHref?: string;        // e.g., "/shop"
    imageKey: string;        // e.g., "bg_one-banner" (css class or image url)
    imageVariant?: string;   // e.g., "two" (second slide style)
};

export type CategoryItem = {
	id: string | number;
	name: string;            // e.g., "Organic Vegetable"
	imageUrl: string;        // e.g., "/assets/images/category/01.png"
	href?: string;           // e.g., "/shop?category=veg"
};

export type ProductItem = {
	slug: string;            // unique identifier used for product page URLs
	image: string;           // image path or absolute URL
	title?: string;
	price?: string | number; // string or number is fine; format on the UI side
	compareAtPrice?: string | number; // previous/strikethrough price
	unitLabel?: string;               // e.g., "500g Pack"
	discountPercent?: number;         // e.g., 25
	category?: string;
	brand?:string;
	sku?: string;
	description?: string
};

export type BestSellingTab = {
	id: string | number;   // category id
	name: string;          // category name (tab label)
	products: ProductItem[]; // top items in that category
};

export type BrandItem = {
	id: string | number;
	name: string;            // e.g., "Organic Vegetable"
	imageUrl: string;        // e.g., "/assets/images/category/01.png"
	href?: string;           // e.g., "/shop?category=veg"
};
