import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Group-level check: the two password boxes must match
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmation = group.get('password_confirmation')?.value;
  return password === confirmation ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.maxLength(255)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.maxLength(20)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  submitting = signal(false);
  errorMessage = signal('');
  // Messages from the API for each field, e.g. { email: ['The email has already been taken.'] }
  serverErrors = signal<Record<string, string[]>>({});

  ngOnInit(): void {
    // Someone who is already signed in has no reason to see this page
    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/');
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // show every field error at once
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.serverErrors.set({});

    const { phone, ...rest } = this.form.getRawValue();

    // Send the phone number only when the customer typed one
    const payload = phone.trim() ? { ...rest, phone: phone.trim() } : rest;

    this.auth.register(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigateByUrl('/');
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);

        if (err.status === 422 && err.error?.errors) {
          // Validation errors from Laravel, grouped by field name
          this.serverErrors.set(err.error.errors);
        } else if (err.status === 0) {
          this.errorMessage.set(
            'Cannot reach the server. Please try again later.',
          );
        } else {
          this.errorMessage.set('Something went wrong. Please try again.');
        }
      },
    });
  }

  // First API message for a field, or an empty text
  serverError(field: string): string {
    return this.serverErrors()[field]?.[0] ?? '';
  }
}
