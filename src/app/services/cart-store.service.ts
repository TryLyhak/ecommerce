import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  Observable,
  catchError,
  defer,
  finalize,
  of,
  tap,
  throwError,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Product } from '../models/product.model';
import {
  Cart,
  CartLine,
  CartResponse,
  GuestCartLine,
  MergeResponse,
} from '../models/cart.model';

@Injectable({
  providedIn: 'root',
})
export class CartStore {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = environment.apiUrl;
  private guestKey = 'scott_guest_cart';

  // Same limit as the API
  static readonly MAX_PER_ITEM = 20;

  // The cart state, kept in Signals so every page updates automatically
  readonly lines = signal<CartLine[]>([]);
  readonly subtotal = signal(0);
  readonly hasIssues = signal(false);
  readonly loading = signal(false);

  // Number of items (quantities added up), shown next to the cart icon
  readonly itemsCount = computed(() =>
    this.lines().reduce((count, line) => count + line.quantity, 0),
  );

  // Load the cart: from the API when signed in, from the browser for visitors
  refresh(): Observable<unknown> {
    if (!this.auth.isLoggedIn()) {
      this.applyGuestCart(this.readGuestCart());
      return of(null);
    }

    this.loading.set(true);
    return this.http.get<CartResponse>(`${this.apiUrl}/cart`).pipe(
      tap((response) => this.applyServerCart(response.data)),
      catchError(() => {
        // The session may have expired: fall back to the visitor cart
        this.applyGuestCart(this.readGuestCart());
        return of(null);
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  // Add a product (or raise its quantity if it is already in the cart)
  add(product: Product, quantity = 1): Observable<unknown> {
    if (this.auth.isLoggedIn()) {
      return this.http
        .post<CartResponse>(`${this.apiUrl}/cart/items`, {
          product_id: product.id,
          quantity,
        })
        .pipe(tap((response) => this.applyServerCart(response.data)));
    }

    // defer() makes this code run when someone subscribes
    return defer(() => {
      if (product.stock_status === 'out_of_stock') {
        return throwError(() => new Error('This product is out of stock.'));
      }

      const guest = this.readGuestCart();
      const existing = guest.find((line) => line.product.id === product.id);
      const newTotal = (existing?.quantity ?? 0) + quantity;

      if (newTotal > CartStore.MAX_PER_ITEM) {
        return throwError(
          () =>
            new Error(
              `You can order at most ${CartStore.MAX_PER_ITEM} of one product.`,
            ),
        );
      }

      if (existing) {
        existing.quantity = newTotal;
      } else {
        guest.push({ product, quantity: newTotal });
      }

      this.saveGuestCart(guest);
      return of(null);
    });
  }

  // Set the quantity of one cart line (it replaces the old quantity)
  setQuantity(lineId: number, quantity: number): Observable<unknown> {
    if (this.auth.isLoggedIn()) {
      return this.http
        .patch<CartResponse>(`${this.apiUrl}/cart/items/${lineId}`, {
          quantity,
        })
        .pipe(tap((response) => this.applyServerCart(response.data)));
    }

    return defer(() => {
      if (quantity > CartStore.MAX_PER_ITEM) {
        return throwError(
          () =>
            new Error(
              `You can order at most ${CartStore.MAX_PER_ITEM} of one product.`,
            ),
        );
      }

      const guest = this.readGuestCart();
      const line = guest.find((item) => item.product.id === lineId);
      if (line) {
        line.quantity = Math.max(1, Math.floor(quantity));
        this.saveGuestCart(guest);
      }
      return of(null);
    });
  }

  // Remove one line
  remove(lineId: number): Observable<unknown> {
    if (this.auth.isLoggedIn()) {
      return this.http
        .delete<CartResponse>(`${this.apiUrl}/cart/items/${lineId}`)
        .pipe(tap((response) => this.applyServerCart(response.data)));
    }

    return defer(() => {
      this.saveGuestCart(
        this.readGuestCart().filter((item) => item.product.id !== lineId),
      );
      return of(null);
    });
  }

  // Remove every line
  clear(): Observable<unknown> {
    if (this.auth.isLoggedIn()) {
      return this.http
        .delete<CartResponse>(`${this.apiUrl}/cart`)
        .pipe(tap((response) => this.applyServerCart(response.data)));
    }

    return defer(() => {
      this.saveGuestCart([]);
      return of(null);
    });
  }

  // Call this right after signing in or registering.
  // A visitor's browser cart is merged into the account cart, then removed from the browser.
  syncAfterSignIn(): Observable<MergeResponse | null> {
    const guest = this.readGuestCart();

    if (guest.length === 0) {
      return new Observable<MergeResponse | null>((subscriber) => {
        this.refresh().subscribe(() => {
          subscriber.next(null);
          subscriber.complete();
        });
      });
    }

    const items = guest.slice(0, 50).map((line) => ({
      product_id: line.product.id,
      quantity: line.quantity,
    }));

    return this.http
      .post<MergeResponse>(`${this.apiUrl}/cart/merge`, { items })
      .pipe(
        tap((response) => {
          // Only forget the browser cart once the server has it
          localStorage.removeItem(this.guestKey);
          this.applyServerCart(response.data);
        }),
      );
  }

  // Call this right after signing out: show the (now empty) visitor cart
  reset(): void {
    this.applyGuestCart(this.readGuestCart());
  }

  // Turns any error from the methods above into a message for the customer
  errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Cannot reach the server. Please try again later.';
      }
      // Laravel validation errors: { errors: { quantity: ["Only 3 in stock."] } }
      const firstGroup = error.error?.errors
        ? (Object.values(error.error.errors)[0] as string[])
        : null;
      return (
        firstGroup?.[0] ??
        error.error?.message ??
        'Something went wrong. Please try again.'
      );
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Something went wrong. Please try again.';
  }

  // ---- Private helpers ----

  // Show the cart exactly as the server worked it out
  private applyServerCart(cart: Cart): void {
    this.lines.set(cart.items);
    this.subtotal.set(cart.subtotal);
    this.hasIssues.set(cart.has_issues);
  }

  // Build the same shape from the visitor's browser cart (prices for display only)
  private applyGuestCart(guest: GuestCartLine[]): void {
    let subtotalCents = 0;
    let hasIssues = false;

    const lines: CartLine[] = guest.map((line) => {
      const unitCents = Math.round(line.product.current_price * 100);
      const issue =
        line.product.stock_status === 'out_of_stock' ? 'out_of_stock' : null;

      if (issue) {
        hasIssues = true;
      } else {
        subtotalCents += unitCents * line.quantity;
      }

      return {
        id: line.product.id,
        quantity: line.quantity,
        unit_price: unitCents / 100,
        line_total: (unitCents * line.quantity) / 100,
        issue,
        available_quantity: null,
        product: line.product,
      };
    });

    this.lines.set(lines);
    this.subtotal.set(subtotalCents / 100);
    this.hasIssues.set(hasIssues);
  }

  private readGuestCart(): GuestCartLine[] {
    try {
      const saved = JSON.parse(localStorage.getItem(this.guestKey) ?? '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return []; // damaged data: start with an empty cart
    }
  }

  private saveGuestCart(guest: GuestCartLine[]): void {
    localStorage.setItem(this.guestKey, JSON.stringify(guest));
    this.applyGuestCart(guest);
  }
}
