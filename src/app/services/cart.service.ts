import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  updateCart(cartItems: any[]): void {
    this.saveCart(cartItems);
  }

  removeById(id: number): void {
    this.saveCart(this.cart().filter((item) => item.id !== id));
  }
  private storageKey = 'myCart';

  // Reactive cart signal
  private cart = signal<any[]>(this.loadCart());

  constructor() {}

  // Load items from localStorage
  private loadCart(): any[] {
    const items = localStorage.getItem(this.storageKey);
    return items ? JSON.parse(items) : [];
  }

  // Save cart to localStorage and update signal
  private saveCart(items: any[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(items));
    this.cart.set(items); // update reactive signal
  }

  // Observable cart items for components
  cartItems() {
    return this.cart(); // use in computed()
  }

  // Cart count
  getCartCount() {
    return this.cart().reduce((count, item) => count + (item.quantity || 1), 0);
  }

  // Add item
  addToCart(item: any) {
    const items = [...this.cart()];
    const existing = items.find((cartItem) => cartItem.id === item.id);

    if (existing) {
      existing.quantity = (existing.quantity || 1) + 1;
    } else {
      items.push({ ...item, quantity: item.quantity || 1 });
    }

    this.saveCart(items);
  }

  // Remove item
  removeFromCart(index: number) {
    const items = [...this.cart()];
    items.splice(index, 1);
    this.saveCart(items);
  }

  // Update quantity
  updateQuantity(index: number, quantity: number) {
    const items = [...this.cart()];
    if (items[index]) {
      if (quantity <= 0) {
        items.splice(index, 1);
      } else {
        items[index].quantity = Math.floor(quantity);
      }
      this.saveCart(items);
    }
  }

  // Clear cart
  clearCart() {
    localStorage.removeItem(this.storageKey);
    this.cart.set([]);
  }
}
