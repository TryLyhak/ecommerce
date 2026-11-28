import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';
import { Address, DeliveryQuote } from '../models/address.model';
import { AddressService } from '../services/address.service';
import { CartStore } from '../services/cart-store.service';
import { DeliveryService } from '../services/delivery.service';
import { OrderService } from '../services/order.service';
import { apiErrorMessage, apiErrorMessages } from '../utils/api-error';

@Component({
  selector: 'app-checkout',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  private router = inject(Router);
  private addressService = inject(AddressService);
  private deliveryService = inject(DeliveryService);
  private orderService = inject(OrderService);
  readonly cart = inject(CartStore);

  // Signals: the template updates automatically when they change
  addresses = signal<Address[]>([]);
  selectedAddressId = signal<number | null>(null);
  quote = signal<DeliveryQuote | null>(null); // the fee and total, worked out by the server
  quoteLoading = signal(false);
  quoteError = signal('');
  pageLoading = signal(true);
  loadError = signal('');
  note = signal('');
  placing = signal(false);
  errors = signal<string[]>([]);

  // One key per visit of this page. If the same key is sent twice
  // (a double-click or a retry), the server creates only one order.
  private idempotencyKey = this.orderService.newIdempotencyKey();

  // Used to ignore an old answer when the customer switches address quickly
  private quoteRequest = 0;

  // The Place order button works only when everything is ready
  canPlaceOrder = computed(
    () =>
      this.selectedAddressId() !== null &&
      this.quote() !== null &&
      !this.quoteLoading() &&
      !this.cart.hasIssues() &&
      this.cart.lines().length > 0 &&
      !this.placing(),
  );

  ngOnInit(): void {
    // Load a fresh cart and the saved addresses together
    forkJoin({
      cart: this.cart.refresh(),
      addresses: this.addressService.list(),
    })
      .pipe(finalize(() => this.pageLoading.set(false)))
      .subscribe({
        next: ({ addresses }) => {
          this.addresses.set(addresses);

          // Start with the default address (the API lists it first)
          const chosen =
            addresses.find((address) => address.is_default) ?? addresses[0];
          if (chosen) {
            this.selectAddress(chosen.id);
          }
        },
        error: (err) => this.loadError.set(apiErrorMessage(err)),
      });
  }

  selectAddress(id: number): void {
    this.selectedAddressId.set(id);
    this.loadQuote();
  }

  onNoteInput(event: Event): void {
    this.note.set((event.target as HTMLTextAreaElement).value);
  }

  // Ask the server for the delivery fee and the total for the chosen address
  private loadQuote(): void {
    const addressId = this.selectedAddressId();

    if (addressId === null || this.cart.lines().length === 0) {
      this.quote.set(null);
      return;
    }

    const requestNumber = ++this.quoteRequest;
    this.quoteLoading.set(true);
    this.quoteError.set('');
    this.quote.set(null);

    this.deliveryService.getQuote(addressId).subscribe({
      next: (quote) => {
        if (requestNumber === this.quoteRequest) {
          this.quote.set(quote);
          this.quoteLoading.set(false);
        }
      },
      error: (err) => {
        if (requestNumber === this.quoteRequest) {
          this.quoteError.set(apiErrorMessage(err));
          this.quoteLoading.set(false);
        }
      },
    });
  }

  placeOrder(): void {
    const addressId = this.selectedAddressId();

    // The button is switched off in these cases, but we check again anyway
    if (addressId === null || !this.canPlaceOrder()) {
      return;
    }

    this.placing.set(true);
    this.errors.set([]);

    const note = this.note().trim();

    this.orderService
      .checkout({
        address_id: addressId,
        payment_method: 'cod',
        customer_note: note || undefined,
        idempotency_key: this.idempotencyKey,
      })
      .pipe(finalize(() => this.placing.set(false)))
      .subscribe({
        next: (response) => {
          // The server emptied the cart, so reload it to show an empty cart
          this.cart.refresh().subscribe();
          // Go to the order page, which shows a "Thank you" banner
          this.router.navigate(['/orders', response.data.id], {
            queryParams: { placed: 1 },
          });
        },
        error: (err) => {
          // Nothing was changed on the server. Show why, and reload the real cart and fee.
          this.errors.set(apiErrorMessages(err));
          this.cart.refresh().subscribe(() => this.loadQuote());
          window.scrollTo({ top: 0, behavior: 'smooth' });
        },
      });
  }

  private money(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
}
