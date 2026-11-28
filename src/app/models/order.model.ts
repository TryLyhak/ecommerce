export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'ready_to_ship'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'paid'
  | 'failed'
  | 'cancelled'
  | 'refunded';
export type PaymentMethod = 'cod' | 'khqr' | 'aba' | 'acleda';

// Friendly texts for the screens (never show the raw codes to customers)
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  ready_to_ship: 'Ready to ship',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  returned: 'Returned',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: 'Unpaid',
  processing: 'Processing',
  paid: 'Paid',
  failed: 'Failed',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: 'Cash on Delivery',
  khqr: 'KHQR',
  aba: 'ABA',
  acleda: 'ACLEDA',
};

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string; // a copy taken when the order was placed
  product_sku: string | null;
  unit_price: number; // the price when the order was placed
  quantity: number;
  line_total: number;
}

export interface OrderShipping {
  name: string;
  phone: string;
  province: string;
  district: string | null;
  address_line: string;
  zone: string | null;
}

export interface OrderStatusEntry {
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  note: string | null;
  created_at: string;
}

export interface OrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  paid_at: string | null;
}

export interface Order {
  id: number;
  order_number: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  can_cancel: boolean;
  subtotal: number;
  delivery_fee: number;
  discount_total: number;
  total: number;
  shipping: OrderShipping;
  customer_note: string | null;
  created_at: string;
  // Only present on some endpoints
  items?: OrderItem[];
  status_history?: OrderStatusEntry[];
  payments?: OrderPayment[];
}

// What the checkout page sends to POST /checkout
export interface CheckoutRequest {
  address_id: number;
  payment_method: PaymentMethod;
  customer_note?: string;
  idempotency_key: string;
}

// Returned by POST /checkout
export interface OrderResponse {
  message: string;
  data: Order;
}
