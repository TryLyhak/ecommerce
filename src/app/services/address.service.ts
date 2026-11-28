import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Address, AddressInput } from '../models/address.model';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // GET /addresses (the default address comes first)
  list(): Observable<Address[]> {
    return this.http
      .get<{ data: Address[] }>(`${this.apiUrl}/addresses`)
      .pipe(map((response) => response.data));
  }

  // POST /addresses
  create(input: AddressInput): Observable<Address> {
    return this.http
      .post<{ data: Address }>(`${this.apiUrl}/addresses`, input)
      .pipe(map((response) => response.data));
  }

  // PATCH /addresses/{id} (only the fields you send are changed)
  update(id: number, input: Partial<AddressInput>): Observable<Address> {
    return this.http
      .patch<{ data: Address }>(`${this.apiUrl}/addresses/${id}`, input)
      .pipe(map((response) => response.data));
  }

  // PATCH /addresses/{id}/default (returns the whole updated list)
  setDefault(id: number): Observable<Address[]> {
    return this.http
      .patch<{ data: Address[] }>(`${this.apiUrl}/addresses/${id}/default`, {})
      .pipe(map((response) => response.data));
  }

  // DELETE /addresses/{id}
  remove(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/addresses/${id}`);
  }
}
