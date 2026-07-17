import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Damage, PaginatedResponse } from '../../interfaces/models';

@Injectable({ providedIn: 'root' })
export class DamagesService {
  private apiUrl = `${environment.apiUrl}/damages`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, limit = 20, search?: string, status?: string, severity?: string): Observable<PaginatedResponse<Damage>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (search) params = params.set('search', search);
    if (status) params = params.set('status', status);
    if (severity) params = params.set('severity', severity);
    return this.http.get<PaginatedResponse<Damage>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<Damage> {
    return this.http.get<Damage>(`${this.apiUrl}/${id}`);
  }

  getByProperty(propertyId: string): Observable<Damage[]> {
    return this.http.get<Damage[]>(`${this.apiUrl}/by-property/${propertyId}`);
  }

  getByTenant(propertyTenantId: string): Observable<Damage[]> {
    return this.http.get<Damage[]>(`${this.apiUrl}/by-tenant/${propertyTenantId}`);
  }

  create(data: Partial<Damage>): Observable<Damage> {
    return this.http.post<Damage>(this.apiUrl, data);
  }

  update(id: string, data: Partial<Damage>): Observable<Damage> {
    return this.http.put<Damage>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}
