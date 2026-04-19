import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Tenant } from '../../interfaces/models';

@Injectable({ providedIn: 'root' })
export class TenantsService {
  private readonly apiUrl = `${environment.apiUrl}/tenants`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Tenant[]> {
    return this.http.get<Tenant[]>(this.apiUrl);
  }

  getById(id: string): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.apiUrl}/${id}`);
  }

  create(payload: Partial<Tenant>): Observable<Tenant> {
    return this.http.post<Tenant>(this.apiUrl, payload);
  }

  update(id: string, payload: Partial<Tenant>): Observable<Tenant> {
    return this.http.put<Tenant>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
