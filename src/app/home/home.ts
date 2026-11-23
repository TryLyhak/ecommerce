import { Component, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Slider } from '../slider/slider';
import { ProductCard } from '../product-card/product-card';
import { CatalogService } from '../services/catalog.service';
import { Product } from '../models/product.model';

@Component({
  selector: 'app-home',
  imports: [Slider, ProductCard, RouterModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private catalog = inject(CatalogService);

  // Signals: the template re-renders automatically when they change
  products = signal<Product[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  ngOnInit(): void {
    // The home page shows the 8 newest products
    this.catalog.getProducts({ per_page: 8, sort: 'newest' }).subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.errorMessage.set(
          'Could not load products. Please try again later.',
        );
        this.loading.set(false);
      },
    });
  }
}
