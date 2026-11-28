import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartStore } from '../services/cart-store.service';
import { AuthService } from '../services/auth.service';
@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private cartStore = inject(CartStore);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);
  cartCount = computed(() => this.cartStore.itemsCount());
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
  // Sign out, then show the empty visitor cart and go back to the home page
  logout(): void {
    const finish = () => {
      this.cartStore.reset();
      this.router.navigateByUrl('/');
    };
    // The session is cleared even if the request fails, so we leave the page either way
    this.auth.logout().subscribe({ next: finish, error: finish });
  }
}
