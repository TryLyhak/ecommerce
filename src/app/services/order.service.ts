import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { PaginatedResponse } from '../models/product.model';
import { CheckoutRequest, Order, OrderResponse } from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // A new unique key for each checkout page visit.
  // If the same key is sent twice (a double-click or a retry), the server creates only one order.
  newIdempotencyKey(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }

  // POST /checkout
  checkout(request: CheckoutRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.apiUrl}/checkout`, request);
  }

  // GET /orders (the customer's own orders, newest first, 10 per page)
  list(page = 1): Observable<PaginatedResponse<Order>> {
    const params = new HttpParams().set('page', page);

    return this.http.get<PaginatedResponse<Order>>(`${this.apiUrl}/orders`, {
      params,
    });
  }

  // GET /orders/{id}: one order with its items, status history and payments
  get(id: number): Observable<Order> {
    return this.http
      .get<{ data: Order }>(`${this.apiUrl}/orders/${id}`)
      .pipe(map((response) => response.data));
  }

  // POST /orders/{id}/cancel (only a pending, unpaid order)
  cancel(id: number): Observable<Order> {
    return this.http
      .post<{ data: Order }>(`${this.apiUrl}/orders/${id}/cancel`, {})
      .pipe(map((response) => response.data));
  }
}
