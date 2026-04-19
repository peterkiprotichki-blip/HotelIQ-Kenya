import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BomoproUser } from '../../shared/interfaces/models';
import { ThemeService } from '../../shared/services/theme/theme.service';

export interface CreateFieldFormValue {
  name: string;
  cropType: string;
  plantingDate: string;
  expectedHarvestDate?: string;
  assignedAgentId: string;
  location?: string;
}

export type FieldFormMode = 'create' | 'edit';

@Component({
  selector: 'app-field-create-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="visible" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-4 flex items-start justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ mode === 'edit' ? 'Edit Field' : 'Create Field' }}</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">Fill in field details and assign a field agent.</p>
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

        <div class="mx-auto grid w-full max-w-lg grid-cols-1 gap-3">
          <input
            [(ngModel)]="form.name"
            placeholder="Field name"
            class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100"
          />
          <input
            [(ngModel)]="form.cropType"
            placeholder="Crop type"
            class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100"
          />

          <select
            [(ngModel)]="form.assignedAgentId"
            class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100"
          >
            <option value="">Select field agent</option>
            <option *ngFor="let agent of agents" [value]="agent._id">{{ agent.name }} ({{ agent.email }})</option>
          </select>

          <input
            [(ngModel)]="form.location"
            placeholder="Location"
            class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100"
          />

          <input
            [(ngModel)]="form.plantingDate"
            type="date"
            title="Planting Date"
            class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100"
          />

          <input
            [(ngModel)]="form.expectedHarvestDate"
            type="date"
            title="Expected Harvest Date"
            class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100"
          />
        </div>

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
            <span *ngIf="!saving">{{ mode === 'edit' ? 'Update Field' : 'Create Field' }}</span>
            <span *ngIf="saving"><i class="fas fa-spinner fa-spin mr-1"></i>{{ mode === 'edit' ? 'Updating...' : 'Creating...' }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class FieldCreateModalComponent {
  @Input() visible = false;
  @Input() saving = false;
  @Input() agents: BomoproUser[] = [];
  @Input() mode: FieldFormMode = 'create';
  @Input() initialValue: Partial<CreateFieldFormValue> | null = null;

  @Output() cancelled = new EventEmitter<void>();
  @Output() createRequested = new EventEmitter<CreateFieldFormValue>();

  error = '';

  form: CreateFieldFormValue = {
    name: '',
    cropType: '',
    plantingDate: '',
    expectedHarvestDate: '',
    assignedAgentId: '',
    location: '',
  };

  constructor(public readonly themeService: ThemeService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue'] || changes['visible']) {
      this.applyInitialValue();
    }
  }

  private applyInitialValue(): void {
    if (this.mode === 'edit' && this.initialValue) {
      this.form = {
        name: this.initialValue.name || '',
        cropType: this.initialValue.cropType || '',
        plantingDate: this.toDateInputValue(this.initialValue.plantingDate),
        expectedHarvestDate: this.toDateInputValue(this.initialValue.expectedHarvestDate),
        assignedAgentId: this.initialValue.assignedAgentId || '',
        location: this.initialValue.location || '',
      };
      return;
    }

    this.form = {
      name: '',
      cropType: '',
      plantingDate: '',
      expectedHarvestDate: '',
      assignedAgentId: '',
      location: '',
    };
  }

  private toDateInputValue(value?: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  submit(): void {
    this.error = '';

    if (!this.form.name || !this.form.cropType || !this.form.plantingDate || !this.form.assignedAgentId) {
      this.error = 'Name, crop type, planting date, and field agent are required.';
      return;
    }

    this.createRequested.emit({
      name: this.form.name,
      cropType: this.form.cropType,
      plantingDate: this.form.plantingDate,
      expectedHarvestDate: this.form.expectedHarvestDate || undefined,
      assignedAgentId: this.form.assignedAgentId,
      location: this.form.location || undefined,
    });

    if (this.mode === 'create') {
      this.form = {
        name: '',
        cropType: '',
        plantingDate: '',
        expectedHarvestDate: '',
        assignedAgentId: '',
        location: '',
      };
    }
  }
}
