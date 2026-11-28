import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';
import { Address } from '../models/address.model';
import { AddressService } from '../services/address.service';
import { DeliveryService } from '../services/delivery.service';
import { apiErrorMessage } from '../utils/api-error';
import { showToast } from '../utils/toast';

@Component({
  selector: 'app-addresses',
  imports: [ReactiveFormsModule],
  templateUrl: './addresses.html',
  styleUrl: './addresses.css',
})
export class Addresses {
  private fb = inject(FormBuilder);
  private addressService = inject(AddressService);
  private deliveryService = inject(DeliveryService);

  // The most addresses one customer can save (same limit as the API)
  readonly maxAddresses = 10;

  // Signals: the template updates automatically when they change
  addresses = signal<Address[]>([]);
  provinces = signal<string[]>([]);
  loading = signal(true);
  loadError = signal('');
  showForm = signal(false);
  editingId = signal<number | null>(null); // null = adding a new address
  saving = signal(false);
  formError = signal('');
  serverErrors = signal<Record<string, string[]>>({});

  // The form and its rules (checked in the browser before anything is sent)
  form = this.fb.nonNullable.group({
    label: ['', [Validators.required, Validators.maxLength(50)]],
    recipient_name: ['', [Validators.required, Validators.maxLength(255)]],
    phone: [
      '',
      [Validators.required, Validators.pattern(/^\+?[0-9 \-]{8,20}$/)],
    ],
    province: ['', [Validators.required]],
    district: ['', [Validators.maxLength(255)]],
    address_line: ['', [Validators.required, Validators.maxLength(500)]],
    is_default: [false],
  });

  ngOnInit(): void {
    this.loadAddresses();

    // The provinces we deliver to, for the dropdown
    this.deliveryService.getProvinces().subscribe({
      next: (provinces) => this.provinces.set(provinces),
      error: (err) => console.error('Error loading provinces:', err),
    });
  }

  loadAddresses(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.addressService
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (addresses) => this.addresses.set(addresses),
        error: (err) => this.loadError.set(apiErrorMessage(err)),
      });
  }

  // Open the empty form
  openAdd(): void {
    this.editingId.set(null);
    this.form.reset({
      label: '',
      recipient_name: '',
      phone: '',
      province: '',
      district: '',
      address_line: '',
      is_default: false,
    });
    this.clearErrors();
    this.showForm.set(true);
  }

  // Open the form filled with an existing address
  openEdit(address: Address): void {
    // An address saved in a province that is switched off for delivery still needs to appear in the list
    if (!this.provinces().includes(address.province)) {
      this.provinces.update((list) => [...list, address.province]);
    }

    this.editingId.set(address.id);
    this.form.reset({
      label: address.label,
      recipient_name: address.recipient_name,
      phone: address.phone,
      province: address.province,
      district: address.district ?? '',
      address_line: address.address_line,
      is_default: address.is_default,
    });
    this.clearErrors();
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.clearErrors();
  }

  // True when the form is editing the address that is currently the default
  editingTheDefault(): boolean {
    const id = this.editingId();
    return (
      id !== null && this.addresses().some((a) => a.id === id && a.is_default)
    );
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // show every field error at once
      return;
    }

    this.saving.set(true);
    this.clearErrors();

    const value = this.form.getRawValue();
    const input = { ...value, district: value.district.trim() || null };
    const id = this.editingId();

    const request =
      id === null
        ? this.addressService.create(input)
        : this.addressService.update(id, input);

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        showToast('success', id === null ? 'Address saved' : 'Address updated');
        this.closeForm();
        this.loadAddresses();
      },
      error: (err) => this.handleSaveError(err),
    });
  }

  setDefault(address: Address): void {
    this.addressService.setDefault(address.id).subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        showToast('success', 'Default address updated');
      },
      error: (err) => showToast('error', apiErrorMessage(err)),
    });
  }

  remove(address: Address): void {
    Swal.fire({
      title: 'Delete this address?',
      text: `${address.label}: ${address.address_line}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it',
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      this.addressService.remove(address.id).subscribe({
        next: () => {
          showToast('success', 'Address deleted');
          this.loadAddresses(); // the server may have chosen a new default
        },
        error: (err) => showToast('error', apiErrorMessage(err)),
      });
    });
  }

  // First API message for a field, or an empty text
  serverError(field: string): string {
    return this.serverErrors()[field]?.[0] ?? '';
  }

  private handleSaveError(err: unknown): void {
    if (
      err instanceof HttpErrorResponse &&
      err.status === 422 &&
      err.error?.errors
    ) {
      // Validation errors from Laravel, grouped by field name
      this.serverErrors.set(err.error.errors);
    } else {
      this.formError.set(apiErrorMessage(err));
    }
  }

  private clearErrors(): void {
    this.formError.set('');
    this.serverErrors.set({});
  }
}
