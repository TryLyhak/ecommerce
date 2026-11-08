import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../services/cart.service';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private cartService = inject(CartService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  cartCount = computed(() => this.cartService.getCartCount());
  searchTerm = '';

  constructor() {
    this.route.queryParamMap.subscribe((params) => {
      this.searchTerm = params.get('search') ?? '';
    });
  }

  search(term: string): void {
    this.searchTerm = term;
    this.router.navigate(['/product-page'], {
      queryParams: term.trim() ? { search: term.trim() } : {},
    });
  }
}
