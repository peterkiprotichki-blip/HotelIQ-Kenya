import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationItem {
  id: number;
  type: NotificationType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly notificationsSubject = new BehaviorSubject<NotificationItem[]>([]);
  readonly notifications$ = this.notificationsSubject.asObservable();

  private nextId = 1;

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    this.notificationsSubject.next(this.notificationsSubject.value.filter((notification) => notification.id !== id));
  }

  private push(type: NotificationType, message: string): void {
    const item: NotificationItem = { id: this.nextId++, type, message };
    const items = [...this.notificationsSubject.value, item];
    this.notificationsSubject.next(items);

    window.setTimeout(() => this.dismiss(item.id), 3000);
  }
}