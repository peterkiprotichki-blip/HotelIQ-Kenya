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

export interface FieldAiInsights {
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
  concerns: string[];
  recommendedActions: string[];
  followUpQuestion?: string;
}

export interface FieldAiInsightsResponse {
  field: Field;
  insights: FieldAiInsights;
  source: 'gemini' | 'fallback';
  model: string;
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

  updateNote(id: string, noteIndex: number, note: string): Observable<Field> {
    return this.http.put<Field>(`${this.apiUrl}/${id}/notes/${noteIndex}`, { note });
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

  analyze(id: string, focus?: string): Observable<FieldAiInsightsResponse> {
    return this.http.post<FieldAiInsightsResponse>(`${this.apiUrl}/${id}/ai/insights`, {
      focus,
    });
  }

  remove(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
