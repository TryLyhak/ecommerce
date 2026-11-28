import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { DeliveryQuote, DeliveryZone } from '../models/address.model';

@Injectable({
  providedIn: 'root',
})
export class DeliveryService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // GET /delivery/zones (public): the zones we deliver to, with their fees
  getZones(): Observable<DeliveryZone[]> {
    return this.http
      .get<{ data: DeliveryZone[] }>(`${this.apiUrl}/delivery/zones`)
      .pipe(map((response) => response.data));
  }

  // The provinces we deliver to, for the address form's dropdown (Phnom Penh first)
  getProvinces(): Observable<string[]> {
    return this.getZones().pipe(
      map((zones) => {
        const provinces = zones.flatMap((zone) => zone.provinces ?? []);
        return [...new Set(provinces)].sort((a, b) => {
          if (a === 'Phnom Penh') return -1;
          if (b === 'Phnom Penh') return 1;
          return a.localeCompare(b);
        });
      }),
    );
  }

  // GET /delivery/quote?address_id=1 (needs a login).
  // The server works out the fee and total from the saved cart, never from the browser.
  getQuote(addressId: number): Observable<DeliveryQuote> {
    const params = new HttpParams().set('address_id', addressId);

    return this.http
      .get<{ data: DeliveryQuote }>(`${this.apiUrl}/delivery/quote`, { params })
      .pipe(map((response) => response.data));
  }
}
