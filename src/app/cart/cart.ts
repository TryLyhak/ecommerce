import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';
import { CartStore } from '../services/cart-store.service';
import { CartLine } from '../models/cart.model';
import { showToast } from '../utils/toast';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css'],
})
export class cart {
  readonly store = inject(CartStore);
  readonly auth = inject(AuthService);
  private router = inject(Router);
  readonly loadingRows = [0, 1, 2];

  // True while a request is running, so buttons cannot be double-clicked
  busy = signal(false);

  ngOnInit(): void {
    // Always show fresh prices and stock from the server when the page opens
    this.store.refresh().subscribe();
  }

  // The most the customer can have of this line (stock or the limit of 20)
  maxFor(line: CartLine): number {
    return Math.min(
      line.available_quantity ?? CartStore.MAX_PER_ITEM,
      CartStore.MAX_PER_ITEM,
    );
  }

  changeQuantity(line: CartLine, quantity: number): void {
    if (quantity < 1) {
      return;
    }
    this.run(this.store.setQuantity(line.id, quantity));
  }

  removeItem(line: CartLine): void {
    Swal.fire({
      title: 'Remove this item?',
      text: line.product.name,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, remove it',
    }).then((result) => {
      if (result.isConfirmed) {
        this.run(this.store.remove(line.id), 'Item removed');
      }
    });
  }

  clearCart(): void {
    Swal.fire({
      title: 'Clear your cart?',
      text: 'All items will be removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e76f51',
      confirmButtonText: 'Clear cart',
    }).then((result) => {
      if (result.isConfirmed) {
        this.run(this.store.clear(), 'Cart emptied');
      }
    });
  }

  checkout(): void {
    if (this.store.lines().length === 0) {
      return;
    }

    if (this.store.hasIssues()) {
      Swal.fire({
        icon: 'warning',
        title: 'Fix your cart first',
        text: 'Remove or reduce the items marked with a warning before checking out.',
      });
      return;
    }

    // A visitor signs in first. Their cart is merged into the account on sign-in.
    if (!this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/login');
      return;
    }

    // Honest placeholder: no fake payment. Real checkout is built in the next phase.
    Swal.fire({
      icon: 'info',
      title: 'Checkout is coming soon',
      text: 'Your cart is saved to your account. Ordering and payment will be available in the next update.',
    });
  }

  // Runs a cart request, blocks the buttons meanwhile and shows errors from the API
  private run(request: Observable<unknown>, successMessage?: string): void {
    this.busy.set(true);

    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => {
        if (successMessage) {
          showToast('success', successMessage);
        }
      },
      error: (err) => showToast('error', this.store.errorMessage(err)),
    });
  }
}
