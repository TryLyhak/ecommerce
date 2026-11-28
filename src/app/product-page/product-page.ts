import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductCard } from '../product-card/product-card';
import { CatalogService } from '../services/catalog.service';
import { Category, Product, ProductFilters } from '../models/product.model';

@Component({
  selector: 'app-product-page',
  imports: [ProductCard, RouterLink],
  templateUrl: './product-page.html',
  styleUrl: './product-page.css',
})
export class ProductPage {
  private catalog = inject(CatalogService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly skeletonCards = Array.from({ length: 8 });

  // Signals: the template updates automatically when they change
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  searchTerm = signal('');
  selectedCategory = signal(''); // category slug, '' = all
  selectedSort = signal<NonNullable<ProductFilters['sort']>>('newest');
  minPrice = signal('');
  maxPrice = signal('');
  priceError = signal('');
  total = signal(0);
  currentPage = signal(1);
  lastPage = signal(1);
  loading = signal(true);
  errorMessage = signal('');

  ngOnInit(): void {
    // Load the categories once, for the dropdown
    this.catalog.getCategories().subscribe({
      next: (categories) => this.categories.set(categories),
      error: (err) => console.error('Error loading categories:', err),
    });

    // Runs on first load and whenever the address query (?search=, ?category=, ?sort=) changes
    this.route.queryParamMap.subscribe((params) => {
      this.searchTerm.set(params.get('search')?.trim() ?? '');
      this.selectedCategory.set(params.get('category') ?? '');
      this.minPrice.set(params.get('min_price') ?? '');
      this.maxPrice.set(params.get('max_price') ?? '');
      // this.priceError.set(''); // clear any previous error

      const sort = params.get('sort');
      this.selectedSort.set(
        sort === 'price_asc' || sort === 'price_desc' ? sort : 'newest',
      );

      this.currentPage.set(1); // any filter change starts on page 1
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.catalog
      .getProducts({
        search: this.searchTerm(),
        category: this.selectedCategory(),
        sort: this.selectedSort(),
        min_price: this.minPrice() ? Number(this.minPrice()) : undefined,
        max_price: this.maxPrice() ? Number(this.maxPrice()) : undefined,
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

  // Called by the category dropdown
  onCategoryChange(event: Event): void {
    const slug = (event.target as HTMLSelectElement).value;
    this.updateFilters({ category: slug || null });
  }

  // Called by the sort dropdown
  onSortChange(event: Event): void {
    const sort = (event.target as HTMLSelectElement).value;
    this.updateFilters({ sort: sort === 'newest' ? null : sort });
  }

  // "Clear filters" keeps the search word but removes category and sort
  clearFilters(): void {
    this.priceError.set('');
    this.updateFilters({
      category: null,
      sort: null,
      min_price: null,
      max_price: null,
    });
  }

  // Called by the Apply button (or the Enter key) in the price boxes
  applyPrice(minValue: string, maxValue: string): void {
    const min = minValue.trim();
    const max = maxValue.trim();

    // Empty is fine. Anything else must be a number that is 0 or more
    const isInvalid = (value: string) =>
      value !== '' && (isNaN(Number(value)) || Number(value) < 0);

    if (isInvalid(min) || isInvalid(max)) {
      this.priceError.set('Please enter a valid price (0 or more).');
      return;
    }

    if (min !== '' && max !== '' && Number(min) > Number(max)) {
      this.priceError.set(
        'The minimum price cannot be higher than the maximum price.',
      );
      return;
    }

    this.priceError.set('');
    this.updateFilters({ min_price: min || null, max_price: max || null });
  }

  // Changes only the given parts of the address. A null value removes that part.
  private updateFilters(changes: Record<string, string | null>): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: changes,
      queryParamsHandling: 'merge',
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
