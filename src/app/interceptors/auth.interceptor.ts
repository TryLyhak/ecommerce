import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

// Runs on every HTTP request the app makes
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);

  // Only talk to our own API: never send the token to other websites
  if (!request.url.startsWith(environment.apiUrl)) {
    return next(request);
  }

  const token = auth.getToken();
  const authorizedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      // The API rejected our token (expired or deleted): forget the session.
      // A failed login also returns 401, but then there is no token to forget.
      if (error.status === 401 && token) {
        auth.clearSession();
      }
      return throwError(() => error);
    }),
  );
};
