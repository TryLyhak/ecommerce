import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import {
  Order,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
} from '../models/order.model';
import { OrderService } from '../services/order.service';
import { apiErrorMessage } from '../utils/api-error';

@Component({
  selector: 'app-orders',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders {
  private orderService = inject(OrderService);

  // Friendly texts for the screen (never show the raw codes)
  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly paymentLabels = PAYMENT_STATUS_LABELS;

  // Signals: the template updates automatically when they change
  orders = signal<Order[]>([]);
  currentPage = signal(1);
  lastPage = signal(1);
  total = signal(0);
  loading = signal(true);
  errorMessage = signal('');

  ngOnInit(): void {
    this.load(1);
  }

  load(page: number): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.orderService
      .list(page)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.orders.set(response.data);
          this.currentPage.set(response.meta.current_page);
          this.lastPage.set(response.meta.last_page);
          this.total.set(response.meta.total);
        },
        error: (err) => this.errorMessage.set(apiErrorMessage(err)),
      });
  }

  // Used by the Previous / Next buttons
  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage()) {
      return;
    }
    this.load(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // How many items (quantities added up) are in an order
  itemCount(order: Order): number {
    return (order.items ?? []).reduce(
      (count, item) => count + item.quantity,
      0,
    );
  }
}
