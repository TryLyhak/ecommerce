import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  // The form and its rules (checked in the browser before anything is sent)
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  submitting = signal(false);
  errorMessage = signal('');

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

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigateByUrl('/');
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.errorMessage.set(this.messageFor(err));
      },
    });
  }

  // Turns an API error into a friendly message
  private messageFor(err: HttpErrorResponse): string {
    switch (err.status) {
      case 0:
        return 'Cannot reach the server. Please try again later.';
      case 401:
      case 403:
        return err.error?.message ?? 'Sign in failed.';
      case 422:
        return 'Please check your email and password.';
      case 429:
        return 'Too many attempts. Please wait a minute and try again.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }
}
