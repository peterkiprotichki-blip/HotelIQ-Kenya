import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Booking {
  _id: string;
  id: string;
  propertyId: string;
  roomId: string;
  roomNumber?: string;
  roomType?: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled' | 'no-show';
  totalPrice: number;
  pricePerNight: number;
  source: 'direct' | 'walk-in' | 'phone' | 'referral';
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class BookingsService {
  private apiUrl = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  getAll(propertyId: string, from?: string, to?: string, status?: string): Observable<Booking[]> {
    let params = new HttpParams().set('propertyId', propertyId);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (status) params = params.set('status', status);

    return this.http.get<Booking[]>(this.apiUrl, { params });
  }

  getById(id: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Booking>): Observable<Booking> {
    return this.http.post<Booking>(this.apiUrl, data);
  }

  update(id: string, data: Partial<Booking>): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${id}`, data);
  }

  updateStatus(id: string, status: string): Observable<Booking> {
    return this.http.patch<Booking>(`${this.apiUrl}/${id}/status`, { status });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
