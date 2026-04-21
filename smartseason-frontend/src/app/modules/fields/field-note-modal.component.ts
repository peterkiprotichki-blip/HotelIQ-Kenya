import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../shared/services/theme/theme.service';

export interface CreateFieldNoteValue {
  note: string;
}

@Component({
  selector: 'app-field-note-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="visible" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-lg rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ mode === 'edit' ? 'Edit Note' : 'Add Note' }}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ fieldName ? (mode === 'edit' ? 'Update the note for ' + fieldName : 'Add a note for ' + fieldName) : (mode === 'edit' ? 'Update this note' : 'Add a note to this field') }}
            </p>
          </div>
          <button
            type="button"
            (click)="cancelled.emit()"
            class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>

        <div *ngIf="error" class="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
          {{ error }}
        </div>

        <textarea
          [(ngModel)]="note"
          rows="6"
          placeholder="Write your note here..."
          class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition-colors placeholder-gray-400 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100 dark:placeholder-gray-500"
        ></textarea>

        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            (click)="cancelled.emit()"
            class="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            (click)="submit()"
            [disabled]="saving"
            class="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            [style.background-color]="themeService.accent"
          >
            <span *ngIf="!saving">{{ mode === 'edit' ? 'Save Changes' : 'Save Note' }}</span>
            <span *ngIf="saving"><i class="fas fa-spinner fa-spin mr-1"></i>Saving...</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class FieldNoteModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() saving = false;
  @Input() fieldName = '';
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() initialNote = '';

  @Output() cancelled = new EventEmitter<void>();
  @Output() createRequested = new EventEmitter<CreateFieldNoteValue>();

  error = '';
  note = '';

  constructor(public readonly themeService: ThemeService) {}

  ngOnChanges(): void {
    if (this.visible) {
      this.note = this.initialNote || '';
      this.error = '';
    }
  }

  submit(): void {
    this.error = '';

    if (!this.note.trim() || this.note.trim().length < 2) {
      this.error = 'Please enter a note.';
      return;
    }

    this.createRequested.emit({ note: this.note.trim() });
    this.note = '';
  }
}