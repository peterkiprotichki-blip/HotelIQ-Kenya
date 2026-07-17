import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PricingSuggestion {
  _id: string;
  id: string;
  propertyId: string;
  roomType: string;
  date: string;
  suggestedPrice: number;
  basePrice: number;
  demandScore: number;
  reasoning: string;
  factorsUsed: string[];
  generatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class PricingAiService {
  private apiUrl = `${environment.apiUrl}/pricing-ai`;

  constructor(private http: HttpClient) {}

  suggest(propertyId: string, roomType: string, from: string, to: string): Observable<PricingSuggestion[]> {
    return this.http.post<PricingSuggestion[]>(`${this.apiUrl}/suggest`, {
      propertyId,
      roomType,
      from,
      to,
    });
  }

  getHistory(propertyId: string, roomType: string, from?: string, to?: string): Observable<PricingSuggestion[]> {
    let params = new HttpParams().set('propertyId', propertyId).set('roomType', roomType);
    if (from) params = params.set('from', from);
    if (to) params = params.set('to', to);

    return this.http.get<PricingSuggestion[]>(`${this.apiUrl}/history`, { params });
  }

  apply(suggestionId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/apply/${suggestionId}`, {});
  }
}
