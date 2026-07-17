import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PublicProperty {
  _id: string;
  id: string;
  name: string;
  county: string;
  town: string;
  address: string;
  latitude: number;
  longitude: number;
  contactPhone: string;
  contactEmail: string;
}

export interface PublicRoom {
  _id: string;
  id: string;
  roomNumber: string;
  roomType: string;
  basePrice: number;
  capacity: number;
  amenities: string[];
}

@Injectable({ providedIn: 'root' })
export class PublicService {
  private apiUrl = `${environment.apiUrl}/public`;

  constructor(private http: HttpClient) {}

  getProperties(): Observable<PublicProperty[]> {
    return this.http.get<PublicProperty[]>(`${this.apiUrl}/properties`);
  }

  getRooms(propertyId: string): Observable<PublicRoom[]> {
    return this.http.get<PublicRoom[]>(`${this.apiUrl}/rooms`, {
      params: new HttpParams().set('propertyId', propertyId)
    });
  }

  createBooking(bookingData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bookings`, bookingData);
  }

  getEvents(near?: string, radiusKm?: number, category?: string): Observable<any[]> {
    let params = new HttpParams();
    if (near) params = params.set('near', near);
    if (radiusKm) params = params.set('radiusKm', radiusKm.toString());
    if (category) params = params.set('category', category);
    return this.http.get<any[]>(`${this.apiUrl}/events`, { params });
  }

  getMyBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bookings/me`);
  }

  bookEventTicket(eventId: string, guestPhone?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/events/${eventId}/book`, { guestPhone });
  }

  getMyEventBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/events/bookings/me`);
  }
}
