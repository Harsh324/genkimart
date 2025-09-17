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
