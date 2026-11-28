import { Routes } from '@angular/router';
import { cart } from './cart/cart';
import { Home } from './home/home';
import { Contact } from './contact/contact';
import { ProductCard } from './product-card/product-card';
import { ProductPage } from './product-page/product-page';
import { ProductDetail } from './product-detail/product-detail';
import { Login } from './login/login';
import { Register } from './register/register';
import { Addresses } from './addresses/addresses';
import { authGuard } from './guards/auth.guard';
import { Checkout } from './checkout/checkout';
import { Orders } from './orders/orders';
import { OrderDetail } from './order-detail/order-detail';

export const routes: Routes = [
  {path: 'cart',component: cart,},
  {path: '',component: Home,},
  { path: 'contact', component: Contact },
  { path: 'product-page', component: ProductPage },
  { path: 'product/:slug', component: ProductDetail },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'account/addresses', component: Addresses, canActivate: [authGuard] },
  { path: 'checkout', component: Checkout, canActivate: [authGuard] },
  { path: 'orders', component: Orders, canActivate: [authGuard] },
  { path: 'orders/:id', component: OrderDetail, canActivate: [authGuard] },
];
