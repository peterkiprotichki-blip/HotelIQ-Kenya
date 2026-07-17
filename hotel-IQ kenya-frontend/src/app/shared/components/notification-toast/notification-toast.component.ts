import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-3">
      <div
        *ngFor="let notification of notifications$ | async"
        class="pointer-events-auto rounded-xl border px-4 py-3 shadow-lg backdrop-blur"
        [ngClass]="notificationClass(notification.type)"
      >
        <div class="flex items-start justify-between gap-3">
          <p class="text-sm font-medium">{{ notification.message }}</p>
          <button type="button" class="text-xs font-semibold opacity-70 hover:opacity-100" (click)="notificationService.dismiss(notification.id)">
            ×
          </button>
        </div>
      </div>
    </div>
  `,
})
export class NotificationToastComponent {
  readonly notifications$ = this.notificationService.notifications$;

  constructor(public readonly notificationService: NotificationService) {}

  notificationClass(type: string): string {
    if (type === 'success') {
      return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-900/30 dark:text-emerald-200';
    }

    if (type === 'error') {
      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-800/60 dark:bg-red-900/30 dark:text-red-200';
    }

    return 'border-gray-200 bg-white text-gray-700 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-100';
  }
}