import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Footer } from './footer/footer';
import { Navbar } from './navbar/navbar';
import { AuthService } from './services/auth.service';
import { CartStore } from './services/cart-store.service';
import { AddressService } from './services/address.service';
import { DeliveryService } from './services/delivery.service';
import { OrderService } from './services/order.service';

@Component({
  selector: 'app-root',
  imports: [Footer, RouterOutlet, Navbar],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected title = 'ng_web';
  private auth = inject(AuthService);
  private cartStore = inject(CartStore);
  private addressService = inject(AddressService);
  private deliveryService = inject(DeliveryService);
  private orderService = inject(OrderService);

  // constructor() {
  //   // TEMPORARY TEST: remove after checking the console
  //   this.auth
  //     .login({ email: 'customer@test.com', password: 'Password123' })
  //     .subscribe(() => {
  //       this.cartStore.refresh().subscribe(() => {
  //         console.log('Cart lines:', this.cartStore.lines().length);
  //         console.log('Items count:', this.cartStore.itemsCount());
  //         console.log('Subtotal:', this.cartStore.subtotal());
  //         console.log('Has issues:', this.cartStore.hasIssues());
  //       });
  //     });
  // }

  ngOnInit(): void {
    // After a page reload we still have the token, but not the user's details.
    // Ask the API who is signed in. If the token is no longer valid, the
    // interceptor clears the session by itself.
    if (this.auth.isLoggedIn()) {
      this.auth.loadCurrentUser().subscribe({ error: () => {} });
    }
    // The cart laod from the API or from the browser storage
    this.cartStore.refresh().subscribe();
    // TEMPORARY TEST: remove after checking the console
    this.deliveryService
      .getZones()
      .subscribe((zones) => console.log('Zones:', zones.length));
    this.deliveryService
      .getProvinces()
      .subscribe((p) => console.log('Provinces:', p.length, p[0]));
    this.addressService.list().subscribe((a) => console.log('Addresses:', a));
    this.orderService
      .list()
      .subscribe((r) => console.log('Orders:', r.meta.total));
  }
}
