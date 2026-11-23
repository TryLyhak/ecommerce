import { Component } from '@angular/core';
import { ProductCard } from '../product-card/product-card';
import { ActivatedRoute, RouterLink, RouterModule } from '@angular/router';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-product-page',
  imports: [ProductCard, RouterLink, RouterModule],
  templateUrl: './product-page.html',
  styleUrl: './product-page.css',
})
export class ProductPage {
  // products: any;
  // constructor(
  //   private route: ActivatedRoute,
  //   private productService: ProductService
  // ) {}

  // ngOnInit(): void {
  //   const id = Number(this.route.snapshot.paramMap.get('id'));
  //   this.productService.getProductById(id).subscribe({
  //     next: (data) => {
  //       this.products = data;
  //     },
  //     error: (err) => {
  //       console.error('Error loading product:', err);
  //     },
  //   });
  // }
  products: any[] = [];
  allProducts: any[] = [];
  searchTerm = '';

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.searchTerm = params.get('search')?.trim() ?? '';
      this.filterProducts();
    });
    this.loadProducts();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (data) => {
        this.allProducts = data;
        this.filterProducts();
      },
      error: (err) => {
        console.error('Error loading products:', err);
      },
    });
  }

  private filterProducts(): void {
    const term = this.searchTerm.toLowerCase();
    this.products = !term
      ? this.allProducts
      : this.allProducts.filter((product) =>
          [product.title, product.category, product.description]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(term),
        );
  }
}
