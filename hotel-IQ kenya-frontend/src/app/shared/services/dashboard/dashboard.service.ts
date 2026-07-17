import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DashboardSummary {
  occupancyRate: number;
  monthlyRevenue: number;
  upcomingBookings: any[];
  aiInsight: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getOccupancy(propertyId: string, from: string, to: string): Observable<any[]> {
    let params = new HttpParams().set('propertyId', propertyId).set('from', from).set('to', to);
    return this.http.get<any[]>(`${this.apiUrl}/occupancy`, { params });
  }

  getRevenue(propertyId: string, from: string, to: string): Observable<any> {
    let params = new HttpParams().set('propertyId', propertyId).set('from', from).set('to', to);
    return this.http.get<any>(`${this.apiUrl}/revenue`, { params });
  }

  getUpcoming(propertyId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/upcoming`, {
      params: new HttpParams().set('propertyId', propertyId)
    });
  }

  getSummary(propertyId: string): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`, {
      params: new HttpParams().set('propertyId', propertyId)
    });
  }
}
