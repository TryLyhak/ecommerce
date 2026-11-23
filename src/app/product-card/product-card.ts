import { CommonModule, JsonPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { toKHRPipe } from '../custom-pipe/to-khr-pipe';
import { CartService } from '../services/cart.service';
import { RouterLink } from '@angular/router';
import { Product } from '../models/product.model';
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, toKHRPipe, RouterLink],
  templateUrl: './product-card.html',
  styleUrls: ['./product-card.css'],
})
export class ProductCard {
  readonly product = input.required<Product>();
  private cartService = inject(CartService);

  addToCart(): void {
    const product = this.product();
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
