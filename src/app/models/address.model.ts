// Shapes of the JSON returned by the addresses and delivery endpoints

export interface Address {
  id: number;
  label: string; // e.g. "Home", "Office"
  recipient_name: string;
  phone: string;
  province: string;
  district: string | null;
  address_line: string;
  is_default: boolean;
}

// What the address form sends to the API
export interface AddressInput {
  label: string;
  recipient_name: string;
  phone: string;
  province: string;
  district?: string | null;
  address_line: string;
  is_default?: boolean;
}

export interface DeliveryZone {
  id: number;
  name: string;
  name_km: string | null;
  fee: number;
  free_delivery_min: number | null; // null = delivery is never free in this zone
  is_active: boolean;
  provinces?: string[];
}

// The delivery part of a quote
export interface DeliveryDetails {
  zone_id: number;
  zone: string;
  fee: number; // what the customer pays (0 when free)
  standard_fee: number; // the zone's normal fee
  free_delivery_min: number | null;
  is_free: boolean;
  amount_to_free_delivery: number | null; // how much more to buy for free delivery
}

// Returned by GET /delivery/quote: everything is worked out by the server
export interface DeliveryQuote {
  address_id: number;
  province: string;
  subtotal: number;
  delivery: DeliveryDetails;
  total: number;
}
