import { Component, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toKHRPipe } from '../custom-pipe/to-khr-pipe';
import { CartStore } from '../services/cart-store.service';
import { Product } from '../models/product.model';
import { showToast } from '../utils/toast';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe, toKHRPipe, RouterLink],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css'],
})
export class ProductCard {
  // The parent page must pass a product from the Laravel API
  readonly product = input.required<Product>();
  private cart = inject(CartStore);

  addToCart(): void {
    this.cart.add(this.product()).subscribe({
      next: () => showToast('success', 'Added to cart'),
      error: (err) => showToast('error', this.cart.errorMessage(err)),
    });
  }
}
