import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Room {
  _id: string;
  id: string;
  propertyId: string;
  roomNumber: string;
  roomType: string;
  basePrice: number;
  capacity: number;
  amenities: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class RoomsService {
  private apiUrl = `${environment.apiUrl}/rooms`;

  constructor(private http: HttpClient) {}

  getAll(propertyId: string): Observable<Room[]> {
    return this.http.get<Room[]>(this.apiUrl, {
      params: new HttpParams().set('propertyId', propertyId)
    });
  }

  getById(id: string): Observable<Room> {
    return this.http.get<Room>(`${this.apiUrl}/${id}`);
  }

  create(data: Partial<Room>): Observable<Room> {
    return this.http.post<Room>(this.apiUrl, data);
  }

  update(id: string, data: Partial<Room>): Observable<Room> {
    return this.http.patch<Room>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
