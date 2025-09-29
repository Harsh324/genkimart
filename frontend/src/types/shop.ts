export type ProductItem = {
  id: string | number;
  slug: string;
  image: string;
  title?: string;
  price?: string | number;
  compareAtPrice?: string | number;
  unitLabel?: string;
  discountPercent?: number;
  category?: string;
  brand?: string;
  sku?: string;
  description?: string;
};

export type PagedResult<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type BrandItem = {
  id: string | number;
  name: string;
  imageUrl: string;
  href?: string;
};

// export type CategoryItem = {
//   id: string | number;
//   name: string;
//   slug: string;
//   parent?: string | number | null;
// };

export type CategoryItem = {
	id: string | number;
	name: string;            // e.g., "Organic Vegetable"
	imageUrl: string;        // e.g., "/assets/images/category/01.png"
	href?: string;           // e.g., "/shop?category=veg"
};
