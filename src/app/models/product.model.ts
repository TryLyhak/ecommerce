// Shapes of the JSON returned by the Laravel API (/api/v1)

export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  name_km: string | null;
  slug: string;
  description: string | null;
  image: string | null;
  children?: Category[]; // only present on the /categories endpoint
}

export interface ProductImage {
  id: number;
  url: string;
  alt_text: string | null;
  is_main: boolean;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product {
  id: number;
  name: string;
  name_km: string | null;
  slug: string;
  description: string | null;
  description_km: string | null;
  brand: string | null;
  price: number;
  sale_price: number | null;
  current_price: number; // the price the customer pays right now
  on_sale: boolean;
  stock_status: StockStatus;
  is_featured: boolean;
  main_image: string | null;
  images?: ProductImage[];
  category?: Category;
}

// Laravel wraps lists in "data" and adds page information in "meta"
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// GET /products/{slug} returns the product plus related products
export interface ProductDetailResponse {
  data: Product;
  related: Product[];
}

// Filters the product list endpoint accepts
export interface ProductFilters {
  search?: string;
  category?: string; // category slug
  brand?: string;
  min_price?: number;
  max_price?: number;
  sort?: 'newest' | 'price_asc' | 'price_desc';
  page?: number;
  per_page?: number;
}
