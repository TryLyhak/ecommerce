import { Component, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { toKHRPipe } from '../custom-pipe/to-khr-pipe';
import { CartService } from '../services/cart.service';
import { Product } from '../models/product.model';

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
  private cartService = inject(CartService);

  addToCart(): void {
    const product = this.product();

    // TEMPORARY: CartService still expects the old FakeStore shape.
    // We replace this when we rebuild the cart in Phase 4.
    this.cartService.addToCart({
      id: product.id,
      title: product.name,
      image: product.main_image,
      price: product.current_price,
      category: product.category?.name,
      description: product.description,
    });
  }
}
