import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { toKHRPipe } from '../custom-pipe/to-khr-pipe';
import { CartService } from '../services/cart.service';
import { CatalogService } from '../services/catalog.service';
import { ProductCard } from '../product-card/product-card';
import { Product } from '../models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CurrencyPipe, toKHRPipe, RouterLink, ProductCard],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css'],
})
export class ProductDetail {
  private route = inject(ActivatedRoute);
  private catalog = inject(CatalogService);
  private cartService = inject(CartService);

  // Signals: the template updates automatically when they change
  product = signal<Product | null>(null);
  related = signal<Product[]>([]);
  loading = signal(true);
  notFound = signal(false);

  ngOnInit(): void {
    // Subscribing (instead of reading once) means the page also reloads when
    // you click a related product, because the slug in the address changes
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.loadProduct(slug);
      }
    });
  }

  private loadProduct(slug: string): void {
    this.loading.set(true);
    this.notFound.set(false);

    this.catalog.getProduct(slug).subscribe({
      next: (response) => {
        this.product.set(response.data);
        this.related.set(response.related);
        this.loading.set(false);
        window.scrollTo({ top: 0 });
      },
      error: () => {
        // The API answers 404 for unknown and draft products
        this.product.set(null);
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  addProductToCart(): void {
    const product = this.product();
    if (!product) {
      return;
    }

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
