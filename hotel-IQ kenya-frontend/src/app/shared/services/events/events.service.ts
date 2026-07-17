import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface KenyanEvent {
  _id: string;
  id: string;
  name: string;
  description: string;
  category: string;
  startDate: string;
  endDate: string;
  county: string;
  town: string;
  latitude: number;
  longitude: number;
  regionRelevance: string[];
  demandImpact: 'low' | 'medium' | 'high';
  isNational: boolean;
  distanceKm?: number;
}

@Injectable({ providedIn: 'root' })
export class EventsService {
  private apiUrl = `${environment.apiUrl}/events`;

  constructor(private http: HttpClient) {}

  getAll(near?: string, radiusKm?: number, from?: string, to?: string, category?: string): Observable<KenyanEvent[]> {
    let params = new HttpParams();
    if (near) params = params.set('near', near);
    if (radiusKm) params = params.set('radiusKm', radiusKm.toString());
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);
    if (category) params = params.set('category', category);

    return this.http.get<KenyanEvent[]>(this.apiUrl, { params });
  }

  getUpcoming(propertyId: string): Observable<KenyanEvent[]> {
    return this.http.get<KenyanEvent[]>(`${this.apiUrl}/upcoming`, {
      params: new HttpParams().set('propertyId', propertyId)
    });
  }

  getById(id: string): Observable<KenyanEvent> {
    return this.http.get<KenyanEvent>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<KenyanEvent>): Observable<KenyanEvent> {
    return this.http.post<KenyanEvent>(this.apiUrl, data);
  }

  getAllBookings(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bookings/all`);
  }
}
