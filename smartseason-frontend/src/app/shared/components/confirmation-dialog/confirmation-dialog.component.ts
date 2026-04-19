import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ThemeService } from '../../services/theme/theme.service';
import { ConfirmationService } from '../../services/confirmation.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="request$ | async as request" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ request.title }}</h2>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ request.message }}</p>

        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            (click)="confirmationService.reject()"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
          >
            {{ request.cancelText || 'Cancel' }}
          </button>
          <button
            type="button"
            (click)="confirmationService.accept()"
            class="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            [style.background-color]="themeService.accent"
          >
            {{ request.confirmText || 'Confirm' }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmationDialogComponent {
  readonly request$ = this.confirmationService.request$;

  constructor(
    public readonly confirmationService: ConfirmationService,
    public readonly themeService: ThemeService,
  ) {}
}