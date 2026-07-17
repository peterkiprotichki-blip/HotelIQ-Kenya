import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-color-picker',
  template: `
    <div class="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-3 z-50">
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">Accent Color</span>
        <button type="button" (click)="close.emit()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>

      <div class="grid grid-cols-5 gap-2">
        <button
          *ngFor="let swatch of swatches"
          type="button"
          class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-105"
          [style.background-color]="swatch"
          [class.border-gray-900]="swatch === color"
          [class.border-transparent]="swatch !== color"
          [class.dark:border-white]="swatch === color"
          (click)="pick(swatch)"
        ></button>
      </div>
    </div>
  `,
})
export class ColorPickerComponent {
  @Input() color = '#10b981';
  @Output() colorChange = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  readonly swatches: string[] = [
    '#10b981', '#059669', '#3b82f6', '#2563eb', '#6366f1',
    '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b',
    '#f97316', '#ef4444', '#22c55e', '#06b6d4', '#0ea5e9',
  ];

  pick(value: string): void {
    this.colorChange.emit(value);
  }
}
