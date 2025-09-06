export interface Product {
  id: string;
  slug: string;
  title: string;
  description?: string;
  price: number;
  salePrice?: number;
  images: string[];
  categoryId?: string;
  inStock: boolean;
  attributes?: Record<string, string | number>;
}