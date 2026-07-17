import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface MaintenanceRequest {
  _id: string;
  tenantId: string;
  propertyTenantId: string;
  unitId: string;
  propertyId: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  attachments: string[];
  assignedToUserId?: string;
  completedAt?: Date;
  completionNotes?: string;
  propertyTenantName: string;
  unitNumber: string;
  dueDate?: Date;
  estimatedCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMaintenanceRequestDto {
  unitId: string;
  propertyId: string;
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  attachments?: string[];
  dueDate?: Date;
  estimatedCost?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

@Injectable({
  providedIn: 'root',
})
export class MaintenanceRequestsService {
  private apiUrl = `${environment.apiUrl}/maintenance-requests`;

  constructor(private http: HttpClient) {}

  getAll(page = 1, limit = 20, status?: string): Observable<PaginatedResponse<MaintenanceRequest>> {
    let params = new HttpParams().set('page', page).set('limit', limit);
    if (status) params = params.set('status', status);
    return this.http.get<PaginatedResponse<MaintenanceRequest>>(this.apiUrl, { params });
  }

  getById(id: string): Observable<MaintenanceRequest> {
    return this.http.get<MaintenanceRequest>(`${this.apiUrl}/${id}`);
  }

  getByUnit(unitId: string, page = 1, limit = 20): Observable<PaginatedResponse<MaintenanceRequest>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedResponse<MaintenanceRequest>>(`${this.apiUrl}/unit/${unitId}`, { params });
  }

  create(dto: CreateMaintenanceRequestDto): Observable<MaintenanceRequest> {
    return this.http.post<MaintenanceRequest>(this.apiUrl, dto);
  }

  update(id: string, dto: Partial<CreateMaintenanceRequestDto>): Observable<MaintenanceRequest> {
    return this.http.put<MaintenanceRequest>(`${this.apiUrl}/${id}`, dto);
  }

  complete(id: string, notes: string, attachments?: string[]): Observable<MaintenanceRequest> {
    return this.http.post<MaintenanceRequest>(`${this.apiUrl}/${id}/complete`, {
      completionNotes: notes,
      attachments: attachments || [],
    });
  }

  assignRequest(id: string, userId: string): Observable<MaintenanceRequest> {
    return this.http.post<MaintenanceRequest>(`${this.apiUrl}/${id}/assign/${userId}`, {});
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats/overview`);
  }
}
