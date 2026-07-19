import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatReply {
  reply: string;
  poweredBy?: 'gemini' | 'local';
}

export interface CompareRoomsResponse {
  reply: string;
  comparisons: Array<{
    roomNumber: string;
    roomType: string;
    capacity: number;
    amenities: string[];
    basePrice: number;
    suggestedPrice: number;
    demandScore: number;
    factorsUsed: string[];
    totalForStay: number;
    savings: number;
    reasoning: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class ChatbotService {
  private readonly baseUrl = `${environment.apiUrl}/public/chatbot`;

  constructor(private readonly http: HttpClient) {}

  sendMessage(message: string, propertyId?: string, context?: ChatMessage[], userLat?: number, userLng?: number): Observable<ChatReply> {
    return this.http.post<ChatReply>(`${this.baseUrl}/message`, {
      message,
      propertyId: propertyId || undefined,
      context: context || undefined,
      userLat: userLat ?? undefined,
      userLng: userLng ?? undefined,
    });
  }

  compareRooms(propertyId: string, checkIn: string, checkOut: string): Observable<CompareRoomsResponse> {
    return this.http.post<CompareRoomsResponse>(`${this.baseUrl}/compare`, {
      propertyId,
      checkIn,
      checkOut,
    });
  }
}
