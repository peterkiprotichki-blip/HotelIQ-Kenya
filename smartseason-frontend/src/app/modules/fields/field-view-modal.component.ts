import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Field } from '../../shared/services/fields/fields.service';

@Component({
  selector: 'app-field-view-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible && field" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 p-4">
      <div class="w-full max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-4 flex items-start justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">Field Details</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">View complete information for this field.</p>
          </div>
          <button
            type="button"
            (click)="closed.emit()"
            class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
          >
            Close
          </button>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Field Name</p>
            <p class="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">{{ field.name }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Crop Type</p>
            <p class="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">{{ field.cropType }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Current Stage</p>
            <p class="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">{{ field.currentStage }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</p>
            <p class="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">{{ field.status }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Planting Date</p>
            <p class="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">{{ field.plantingDate | date:'mediumDate' }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Expected Harvest</p>
            <p class="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">{{ field.expectedHarvestDate ? (field.expectedHarvestDate | date:'mediumDate') : 'N/A' }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Assigned Agent</p>
            <p class="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">{{ agentNameResolver(field.assignedAgentId) }}</p>
          </div>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Location</p>
            <p class="mt-1 text-sm font-medium text-gray-800 dark:text-gray-100">{{ field.location || 'N/A' }}</p>
          </div>
        </div>

        <div class="mt-5">
          <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">All Notes</p>
          <div *ngIf="field.notes?.length; else noNotes" class="mt-2 max-h-56 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-slate-700 dark:bg-slate-900/40">
            <div *ngFor="let note of field.notes; let last = last" class="py-2" [class.border-b]="!last" [class.border-gray-200]="!last" [class.dark:border-slate-700]="!last">
              <p class="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">{{ note }}</p>
            </div>
          </div>
          <ng-template #noNotes>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">No notes yet.</p>
          </ng-template>
        </div>
      </div>
    </div>
  `,
})
export class FieldViewModalComponent {
  @Input() visible = false;
  @Input() field: Field | null = null;
  @Input() agentNameResolver: (agentId: string) => string = () => 'Unassigned';

  @Output() closed = new EventEmitter<void>();
}
