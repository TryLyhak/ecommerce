import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  Category,
  PaginatedResponse,
  Product,
  ProductDetailResponse,
  ProductFilters,
} from '../models/product.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private http = inject(HttpClient);

  // The API address comes from the environment file, never hardcoded
  private apiUrl = environment.apiUrl;

  // GET /products (with optional search, category, price filters, sorting, paging)
  getProducts(
    filters: ProductFilters = {},
  ): Observable<PaginatedResponse<Product>> {
    let params = new HttpParams();

    // Only send filters that actually have a value
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }

    return this.http.get<PaginatedResponse<Product>>(
      `${this.apiUrl}/products`,
      { params },
    );
  }

  // GET /products/{slug} (the product plus related products)
  getProduct(slug: string): Observable<ProductDetailResponse> {
    return this.http.get<ProductDetailResponse>(
      `${this.apiUrl}/products/${slug}`,
    );
  }

  // GET /categories (top-level categories with their children)
  getCategories(): Observable<Category[]> {
    return this.http
      .get<{ data: Category[] }>(`${this.apiUrl}/categories`)
      .pipe(map((response) => response.data));
  }
}
