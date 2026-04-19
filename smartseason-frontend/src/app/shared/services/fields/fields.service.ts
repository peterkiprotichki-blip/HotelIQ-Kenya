import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type FieldStage = 'planted' | 'growing' | 'ready' | 'harvested';
export type FieldStatus = 'active' | 'at_risk' | 'completed';

export interface Field {
  _id: string;
  name: string;
  cropType: string;
  plantingDate: string;
  expectedHarvestDate?: string;
  currentStage: FieldStage;
  status: FieldStatus;
  assignedAgentId: string;
  location?: string;
  notes: string[];
  updatedAt: string;
}

export interface FieldStats {
  totalFields: number;
  statusBreakdown: {
    active: number;
    atRisk: number;
    completed: number;
  };
  stageBreakdown: {
    planted: number;
    growing: number;
    ready: number;
    harvested: number;
  };
  atRiskFields: Array<{
    _id: string;
    name: string;
    cropType: string;
    currentStage: FieldStage;
    expectedHarvestDate?: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class FieldsService {
  private readonly apiUrl = `${environment.apiUrl}/fields`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<Field[]> {
    return this.http.get<Field[]>(this.apiUrl);
  }

  getStats(): Observable<FieldStats> {
    return this.http.get<FieldStats>(`${this.apiUrl}/stats`);
  }

  create(payload: {
    name: string;
    cropType: string;
    plantingDate: string;
    expectedHarvestDate?: string;
    assignedAgentId: string;
    location?: string;
  }): Observable<Field> {
    return this.http.post<Field>(this.apiUrl, payload);
  }

  addUpdate(id: string, payload: { stage?: FieldStage; note: string }): Observable<Field> {
    return this.http.post<Field>(`${this.apiUrl}/${id}/updates`, payload);
  }

  update(id: string, payload: {
    name?: string;
    cropType?: string;
    plantingDate?: string;
    currentStage?: FieldStage;
    expectedHarvestDate?: string;
    assignedAgentId?: string;
    location?: string;
  }): Observable<Field> {
    return this.http.put<Field>(`${this.apiUrl}/${id}`, payload);
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
