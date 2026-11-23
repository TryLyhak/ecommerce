import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductCard } from '../product-card/product-card';
import { CatalogService } from '../services/catalog.service';
import { Product } from '../models/product.model';

@Component({
  selector: 'app-product-page',
  imports: [ProductCard, RouterLink],
  templateUrl: './product-page.html',
  styleUrl: './product-page.css',
})
export class ProductPage {
  private catalog = inject(CatalogService);
  private route = inject(ActivatedRoute);

  // Signals: the template updates automatically when they change
  products = signal<Product[]>([]);
  searchTerm = signal('');
  total = signal(0); // how many products match in total
  currentPage = signal(1);
  lastPage = signal(1);
  loading = signal(true);
  errorMessage = signal('');

  ngOnInit(): void {
    // Runs on first load and whenever the ?search= part of the address changes
    this.route.queryParamMap.subscribe((params) => {
      this.searchTerm.set(params.get('search')?.trim() ?? '');
      this.currentPage.set(1); // a new search always starts on page 1
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.catalog
      .getProducts({
        search: this.searchTerm(),
        page: this.currentPage(),
        per_page: 12,
      })
      .subscribe({
        next: (response) => {
          this.products.set(response.data);
          this.total.set(response.meta.total);
          this.lastPage.set(response.meta.last_page);
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

  // Used by the Previous / Next buttons
  goToPage(page: number): void {
    if (page < 1 || page > this.lastPage()) {
      return;
    }
    this.currentPage.set(page);
    this.loadProducts();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
