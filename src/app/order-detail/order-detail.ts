import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import {
  Order,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from '../models/order.model';
import { OrderService } from '../services/order.service';
import { apiErrorMessage } from '../utils/api-error';
import { showToast } from '../utils/toast';

@Component({
  selector: 'app-order-detail',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './order-detail.html',
  styleUrl: './order-detail.css',
})
export class OrderDetail {
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  // Friendly texts for the screen (never show the raw codes)
  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly paymentLabels = PAYMENT_STATUS_LABELS;
  readonly methodLabels = PAYMENT_METHOD_LABELS;

  // Signals: the template updates automatically when they change
  order = signal<Order | null>(null);
  loading = signal(true);
  notFound = signal(false);
  errorMessage = signal('');
  cancelling = signal(false);
  justPlaced = signal(false); // true right after checkout, to show the "Thank you" banner

  ngOnInit(): void {
    this.justPlaced.set(
      this.route.snapshot.queryParamMap.get('placed') === '1',
    );

    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));

      if (!Number.isInteger(id) || id < 1) {
        this.notFound.set(true);
        this.loading.set(false);
        return;
      }

      this.load(id);
    });
  }

  private load(id: number): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.errorMessage.set('');

    this.orderService
      .get(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (order) => this.order.set(order),
        error: (err) => {
          // The API answers 404 for an order that does not exist or belongs to someone else
          if (err instanceof HttpErrorResponse && err.status === 404) {
            this.notFound.set(true);
          } else {
            this.errorMessage.set(apiErrorMessage(err));
          }
        },
      });
  }

  cancelOrder(): void {
    const order = this.order();

    if (!order || !order.can_cancel || this.cancelling()) {
      return;
    }

    Swal.fire({
      title: 'Cancel this order?',
      text: `Order ${order.order_number} will be cancelled.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'Keep my order',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.cancelling.set(true);

      this.orderService
        .cancel(order.id)
        .pipe(finalize(() => this.cancelling.set(false)))
        .subscribe({
          next: (updated) => {
            this.order.set(updated);
            this.justPlaced.set(false);
            showToast('success', 'Order cancelled');
          },
          error: (err) => {
            // For example, staff confirmed the order a moment ago: show why, then the real status
            showToast('error', apiErrorMessage(err));
            this.load(order.id);
          },
        });
    });
  }
}
