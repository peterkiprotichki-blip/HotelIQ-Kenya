import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Field, FieldStage } from '../../shared/services/fields/fields.service';
import { ThemeService } from '../../shared/services/theme/theme.service';

@Component({
  selector: 'app-fields-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="loading" class="py-10 text-center text-gray-500 dark:text-gray-400">
      <i class="fas fa-spinner fa-spin mr-2"></i>Loading fields...
    </div>

    <div *ngIf="!loading" class="space-y-4 md:hidden">
      <div *ngFor="let field of fields" class="rounded-xl border border-gray-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div class="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ field.name }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ field.cropType }} · planted {{ field.plantingDate | date:'mediumDate' }}</p>
          </div>
          <span class="rounded-full px-2.5 py-1 text-xs font-semibold" [ngStyle]="stageStyle(field.currentStage)">{{ field.currentStage }}</span>
        </div>

        <div class="mb-3 text-sm text-gray-600 dark:text-gray-300">
          <p>Assigned agent: <span class="font-medium">{{ agentNameResolver(field.assignedAgentId) }}</span></p>
          <p *ngIf="field.expectedHarvestDate">Expected harvest: {{ field.expectedHarvestDate | date:'mediumDate' }}</p>
          <div class="mt-2">
            <div class="mb-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Notes</span>
              <span *ngIf="field.notes.length" class="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-600 dark:bg-slate-700 dark:text-gray-200">{{ field.notes.length }}</span>
            </div>
            <div *ngIf="field.notes.length; else mobileNoNotes" class="max-h-28 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-slate-700 dark:bg-slate-900/40">
              <div *ngFor="let note of field.notes; let last = last" class="py-1 text-xs text-gray-600 dark:text-gray-300" [class.border-b]="!last" [class.border-gray-200]="!last" [class.dark:border-slate-700]="!last">
                <span class="block font-medium text-gray-700 dark:text-gray-200">{{ noteSummary(note) }}</span>
                <span class="mt-0.5 block whitespace-pre-wrap text-[11px] leading-5 text-gray-500 dark:text-gray-400">{{ noteBody(note) }}</span>
              </div>
            </div>
            <ng-template #mobileNoNotes>
              <p class="text-xs text-gray-500 dark:text-gray-400">No notes yet</p>
            </ng-template>
          </div>
        </div>

        <div class="border-t border-gray-100 pt-3 dark:border-slate-700">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</p>
          <select
            [(ngModel)]="updateDraft[field._id].stage"
            (change)="stageChanged.emit({ field: field, stage: updateDraft[field._id].stage })"
            class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100"
          >
            <option *ngFor="let stage of stages" [value]="stage">{{ stage }}</option>
          </select>

          <div class="mt-3 flex flex-wrap gap-2">
            <button (click)="viewRequested.emit(field)" class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700">View</button>
            <button
              (click)="addNoteRequested.emit(field)"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              [style.background-color]="themeService.accent"
            >
              Add Note
            </button>
            <button *ngIf="isAdminLike" (click)="editRequested.emit(field)" class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700">Edit</button>
            <button *ngIf="isAdminLike" (click)="deleteRequested.emit(field)" class="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30">Delete</button>
          </div>
        </div>
      </div>

      <div *ngIf="!fields.length" class="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-slate-600 dark:text-gray-400">
        No fields found yet.
      </div>
    </div>

    <div *ngIf="!loading && fields.length" class="hidden overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800 md:block">
      <div class="min-w-[1160px]">
        <div class="grid grid-cols-12 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-gray-300">
          <div class="col-span-3">Field</div>
          <div class="col-span-2">Agent</div>
          <div class="col-span-2">Status</div>
          <div class="col-span-1">Harvest</div>
          <div class="col-span-2">Notes</div>
          <div class="col-span-2">Actions</div>
        </div>

        <div *ngFor="let field of fields" class="grid grid-cols-12 items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm text-gray-700 last:border-b-0 dark:border-slate-700 dark:text-gray-200">
          <div class="col-span-3">
            <p class="font-semibold text-gray-800 dark:text-gray-100">{{ field.name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ field.cropType }} · planted {{ field.plantingDate | date:'mediumDate' }}</p>
          </div>

          <div class="col-span-2">
            <p class="font-medium">{{ agentNameResolver(field.assignedAgentId) }}</p>
          </div>

          <div class="col-span-2">
            <select
              [(ngModel)]="updateDraft[field._id].stage"
              (change)="stageChanged.emit({ field: field, stage: updateDraft[field._id].stage })"
              class="w-full rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100"
              [ngStyle]="stageStyle(updateDraft[field._id].stage)"
            >
              <option *ngFor="let stage of stages" [value]="stage">{{ stage }}</option>
            </select>
          </div>

          <div class="col-span-1 text-xs text-gray-600 dark:text-gray-300">
            <span *ngIf="field.expectedHarvestDate; else noHarvest">{{ field.expectedHarvestDate | date:'mediumDate' }}</span>
            <ng-template #noHarvest>N/A</ng-template>
          </div>

          <div class="col-span-2 text-xs text-gray-600 dark:text-gray-300">
            <div *ngIf="field.notes.length; else noNotes" class="max-h-28 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-2 dark:border-slate-700 dark:bg-slate-900/40">
              <div *ngFor="let note of field.notes; let last = last" class="py-1" [class.border-b]="!last" [class.border-gray-200]="!last" [class.dark:border-slate-700]="!last">
                <span class="block font-medium text-gray-700 dark:text-gray-200">{{ noteSummary(note) }}</span>
                <span class="mt-0.5 block whitespace-pre-wrap text-[11px] leading-5 text-gray-500 dark:text-gray-400">{{ noteBody(note) }}</span>
              </div>
            </div>
            <ng-template #noNotes>No notes yet</ng-template>
          </div>

          <div class="col-span-2 flex flex-wrap gap-2">
            <button (click)="viewRequested.emit(field)" class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700">View</button>
            <button
              (click)="addNoteRequested.emit(field)"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              [style.background-color]="themeService.accent"
            >
              Add Note
            </button>
            <button *ngIf="isAdminLike" (click)="editRequested.emit(field)" class="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700">Edit</button>
            <button *ngIf="isAdminLike" (click)="deleteRequested.emit(field)" class="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30">Delete</button>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="!loading && !fields.length" class="hidden rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-slate-600 dark:text-gray-400 md:block">
      No fields found yet.
    </div>
  `,
})
export class FieldsListComponent {
  @Input() fields: Field[] = [];
  @Input() loading = false;
  @Input() updateDraft: Record<string, { stage: FieldStage; note: string }> = {};
  @Input() stages: FieldStage[] = [];
  @Input() agentNameResolver: (agentId: string) => string = () => 'Unassigned';
  @Input() isAdminLike = false;

  @Output() stageChanged = new EventEmitter<{ field: Field; stage: FieldStage }>();
  @Output() editRequested = new EventEmitter<Field>();
  @Output() deleteRequested = new EventEmitter<Field>();
  @Output() addNoteRequested = new EventEmitter<Field>();
  @Output() viewRequested = new EventEmitter<Field>();

  constructor(public readonly themeService: ThemeService) {}

  noteSummary(note: string): string {
    const separatorIndex = note.indexOf(' - ');
    if (separatorIndex === -1) {
      return 'Note';
    }

    return note.slice(0, separatorIndex);
  }

  noteBody(note: string): string {
    const separatorIndex = note.indexOf(' - ');
    if (separatorIndex === -1) {
      return note;
    }

    return note.slice(separatorIndex + 3);
  }

  stageStyle(stage: FieldStage): Record<string, string> {
    if (stage === 'planted') {
      return {
        'background-color': 'var(--accent-100)',
        color: 'var(--accent-800)',
      };
    }

    if (stage === 'growing') {
      return {
        'background-color': 'var(--accent-200)',
        color: 'var(--accent-900)',
      };
    }

    if (stage === 'ready') {
      return {
        'background-color': 'var(--accent-300)',
        color: 'var(--accent-900)',
      };
    }

    return {
      'background-color': 'var(--accent-50)',
      color: 'var(--accent-700)',
    };
  }
}
