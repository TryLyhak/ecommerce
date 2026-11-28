import { Product } from './product.model';

// Problems the API can report for a cart line
export type CartIssue = 'unavailable' | 'out_of_stock' | 'insufficient_stock';

// One line of the cart, as the Laravel API returns it
// (for visitors we build the same shape in the browser)
export interface CartLine {
  id: number; // cart item id (for visitors: the product id)
  quantity: number;
  unit_price: number; // price of one item right now
  line_total: number; // unit_price x quantity
  issue: CartIssue | null; // null = this line can be bought
  available_quantity: number | null; // stock left, when the API knows it
  product: Product;
}

export interface Cart {
  items: CartLine[];
  items_count: number;
  subtotal: number; // only counts lines without an issue
  has_issues: boolean;
}

// Returned by GET /cart and by the cart change endpoints
export interface CartResponse {
  message?: string;
  data: Cart;
}

// Returned by POST /cart/merge
export interface MergeResponse extends CartResponse {
  merged: number;
  adjusted: { product_id: number; requested: number; added: number }[];
  skipped: { product_id: number; reason: string }[];
}

// What we keep in the browser for visitors
export interface GuestCartLine {
  product: Product;
  quantity: number;
}
