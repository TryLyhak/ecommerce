// Shapes of the JSON returned by the Laravel auth endpoints

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  language: 'en' | 'km';
  is_active: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
}

// Returned by POST /auth/login and POST /auth/register
export interface AuthResponse {
  message: string;
  user: AuthUser;
  token: string;
}

// Returned by GET /auth/me
export interface MeResponse {
  user: AuthUser;
  roles: string[]; // e.g. ["customer"] or ["super_admin"]
  permissions: string[]; // e.g. ["products.create", ...]
}
