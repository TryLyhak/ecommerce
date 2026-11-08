import { Component, OnInit } from '@angular/core';
import { CartService } from '../services/cart.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { RouterLink } from '@angular/router';
import { SelectedCountPipe } from './selected-count.pipe';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, SelectedCountPipe],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css'],
})
export class cart implements OnInit {
  cartItems: any[] = [];
  total: number = 0;
  selectAllChecked = false;

  constructor(private cartService: CartService) {}

  ngOnInit() {
    this.cartItems = this.cartService.cartItems().map((item: any) => ({
      ...item,
      quantity: item.quantity || 1,
      selected: true,
    }));
    this.calculateTotal();
  }

  // removeItem(index: number) {
  //   this.cartService.removeFromCart(index);
  //   this.cartItems = this.cartService.cartItems();
  //   this.calculateTotal();
  // }

  removeItem(index: number) {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this item from your cart?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.cartService.removeFromCart(index);
        this.cartItems = this.cartService.cartItems().map((item: any) => ({
          ...item,
          selected: true,
        }));
        this.calculateTotal();

        Swal.fire('Removed!', 'The item has been removed.', 'success');
      }
    });
  }
  //  checkout

  checkout() {
    const selectedItems = this.cartItems.filter((item) => item.selected);

    if (selectedItems.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Nothing selected',
        text: 'Select at least one item before checking out.',
        confirmButtonText: 'OK',
      });
      return;
    }

    Swal.fire({
      title: 'Confirm Payment',
      html: `
      <p>Total Amount: <b>$${this.total.toFixed(2)}</b></p>
      <p>Do you want to proceed with payment?</p>
    `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Pay Now',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#28a745',
      cancelButtonColor: '#dc3545',
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: 'success',
          title: 'Payment Successful! 🎉',
          text: 'Thank you for your purchase.',
          confirmButtonText: 'OK',
        }).then(() => {
          const purchasedIds = new Set(selectedItems.map((item) => item.id));
          this.cartService.updateCart(
            this.cartService
              .cartItems()
              .filter((item) => !purchasedIds.has(item.id)),
          );
          this.cartItems = this.cartService.cartItems().map((item: any) => ({
            ...item,
            selected: true,
          }));
          this.selectAllChecked = this.cartItems.length > 0;
          this.calculateTotal();
        });
      }
    });
  }

  clearCart() {
    if (this.cartItems.length === 0) {
      return;
    }

    Swal.fire({
      title: 'Clear your cart?',
      text: 'All items will be removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e76f51',
      confirmButtonText: 'Clear cart',
    }).then((result) => {
      if (result.isConfirmed) {
        this.cartService.clearCart();
        this.cartItems = [];
        this.selectAllChecked = false;
        this.total = 0;
      }
    });
  }

  calculateTotal() {
    this.total = this.cartItems
      .filter((item) => item.selected) // only selected items
      .reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
    this.selectAllChecked =
      this.cartItems.length > 0 && this.cartItems.every((item) => item.selected);
  }

  toggleSelectAll() {
    this.cartItems.forEach((item) => (item.selected = this.selectAllChecked));
    this.calculateTotal();
  }

  onItemSelectionChange() {
    this.selectAllChecked = this.cartItems.every((item) => item.selected);
    this.calculateTotal();
  }

  changeQuantity(index: number, quantity: number): void {
    const nextQuantity = Math.max(1, Math.floor(quantity || 1));
    this.cartItems[index].quantity = nextQuantity;
    this.cartService.updateQuantity(index, nextQuantity);
    this.calculateTotal();
  }
}
