import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  AuthResponse,
  AuthUser,
  LoginRequest,
  MeResponse,
  RegisterRequest,
} from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private tokenKey = 'scott_auth_token';

  // The session state, kept in Signals so the templates update automatically
  private tokenSignal = signal<string | null>(
    localStorage.getItem(this.tokenKey),
  );
  readonly user = signal<AuthUser | null>(null);
  readonly roles = signal<string[]>([]);
  readonly permissions = signal<string[]>([]);

  readonly isLoggedIn = computed(() => this.tokenSignal() !== null);

  // Staff = anyone who holds at least one permission (customers hold none)
  readonly isStaff = computed(() => this.permissions().length > 0);

  // Used by the interceptor to attach the token to API requests
  getToken(): string | null {
    return this.tokenSignal();
  }

  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  // POST /auth/login, then load roles and permissions with GET /auth/me
  login(credentials: LoginRequest): Observable<MeResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap((response) => this.saveToken(response.token)),
        switchMap(() => this.loadCurrentUser()),
      );
  }

  // POST /auth/register (the API logs the new customer in straight away)
  register(data: RegisterRequest): Observable<MeResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, data)
      .pipe(
        tap((response) => this.saveToken(response.token)),
        switchMap(() => this.loadCurrentUser()),
      );
  }

  // GET /auth/me: who is signed in, with roles and permissions
  loadCurrentUser(): Observable<MeResponse> {
    return this.http.get<MeResponse>(`${this.apiUrl}/auth/me`).pipe(
      tap((response) => {
        this.user.set(response.user);
        this.roles.set(response.roles);
        this.permissions.set(response.permissions);
      }),
    );
  }

  // POST /auth/logout. The session is cleared even if the request fails.
  logout(): Observable<unknown> {
    return this.http
      .post(`${this.apiUrl}/auth/logout`, {})
      .pipe(finalize(() => this.clearSession()));
  }

  // Forget the token and everything we know about the user
  clearSession(): void {
    localStorage.removeItem(this.tokenKey);
    this.tokenSignal.set(null);
    this.user.set(null);
    this.roles.set([]);
    this.permissions.set([]);
  }

  private saveToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
    this.tokenSignal.set(token);
  }
}