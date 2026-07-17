import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Property, PaginatedResponse } from '../../interfaces/models';

@Injectable({ providedIn: 'root' })
export class PropertiesService {
  private apiUrl = `${environment.apiUrl}/properties`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, limit = 20, search?: string, status?: string, type?: string): Observable<PaginatedResponse<Property>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    if (type) params = params.set('type', type);
    return this.http.get<PaginatedResponse<Property>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<Property> {
    return this.http.get<Property>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Property>): Observable<Property> {
    return this.http.post<Property>(this.apiUrl, data);
  }

  update(id: string, data: Partial<Property>): Observable<Property> {
    return this.http.put<Property>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}
