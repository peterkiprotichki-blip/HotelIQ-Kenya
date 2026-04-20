import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Field, FieldAiInsights, FieldStage, FieldStatus } from '../../shared/services/fields/fields.service';

@Component({
  selector: 'app-field-view-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible && field" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/70 p-3">
      <div class="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-gray-200/90 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-800 sm:p-5">
        <div class="mb-3 flex items-start justify-between gap-4 border-b border-gray-200 pb-3 dark:border-slate-700">
          <div>
            <h2 class="text-xl font-semibold leading-tight text-gray-900 dark:text-gray-50">Field Details</h2>
            <p class="mt-0.5 text-sm text-gray-500 dark:text-gray-400">View complete information for this field.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              (click)="analyzeRequested.emit()"
              class="rounded-xl border px-3 py-1.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              [style.background-color]="'var(--accent, #0f766e)'"
              [disabled]="analysisLoading"
            >
              <i class="fas mr-2" [class.fa-spinner]="analysisLoading" [class.fa-spin]="analysisLoading" [class.fa-wand-magic-sparkles]="!analysisLoading"></i>
              {{ analysisLoading ? 'Analyzing...' : 'Analyze with AI' }}
            </button>
            <button
              type="button"
              (click)="closed.emit()"
              class="rounded-xl border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-slate-600 dark:text-gray-200 dark:hover:bg-slate-700"
            >
              Close
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto pr-1">
          <div class="mb-3 flex flex-wrap items-center gap-2">
            <h3 class="text-base font-semibold text-gray-900 dark:text-gray-100">{{ field.name }}</h3>
            <span class="rounded-full border border-gray-300 bg-white px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600 dark:border-slate-600 dark:bg-slate-800 dark:text-gray-300">{{ field.cropType }}</span>
            <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" [ngStyle]="stageStyle(field.currentStage)">{{ stageLabel(field.currentStage) }}</span>
            <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" [ngStyle]="statusStyle(field.status)">{{ statusLabel(field.status) }}</span>
          </div>

          <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div class="rounded-lg border border-gray-200 bg-gray-50/70 p-2.5 dark:border-slate-700 dark:bg-slate-900/40">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Field Name</p>
              <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{{ field.name }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50/70 p-2.5 dark:border-slate-700 dark:bg-slate-900/40">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Crop Type</p>
              <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{{ field.cropType }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50/70 p-2.5 dark:border-slate-700 dark:bg-slate-900/40">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Current Stage</p>
            <p class="mt-1">
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold" [ngStyle]="stageStyle(field.currentStage)">{{ stageLabel(field.currentStage) }}</span>
            </p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50/70 p-2.5 dark:border-slate-700 dark:bg-slate-900/40">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</p>
            <p class="mt-1">
              <span class="rounded-full px-2.5 py-1 text-xs font-semibold" [ngStyle]="statusStyle(field.status)">{{ statusLabel(field.status) }}</span>
            </p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50/70 p-2.5 dark:border-slate-700 dark:bg-slate-900/40">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Planting Date</p>
              <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{{ field.plantingDate | date:'mediumDate' }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50/70 p-2.5 dark:border-slate-700 dark:bg-slate-900/40">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Expected Harvest</p>
              <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{{ field.expectedHarvestDate ? (field.expectedHarvestDate | date:'mediumDate') : 'N/A' }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50/70 p-2.5 dark:border-slate-700 dark:bg-slate-900/40">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Assigned Agent</p>
              <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{{ agentNameResolver(field.assignedAgentId) }}</p>
            </div>
            <div class="rounded-lg border border-gray-200 bg-gray-50/70 p-2.5 dark:border-slate-700 dark:bg-slate-900/40">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Location</p>
              <p class="mt-1 text-sm font-semibold text-gray-900 dark:text-gray-100">{{ field.location || 'N/A' }}</p>
            </div>
          </div>

          <div class="mt-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">All Notes</p>
            <div *ngIf="field.notes.length; else noNotes" class="mt-1.5 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2.5 dark:border-slate-700 dark:bg-slate-900/40">
              <div *ngFor="let note of field.notes; let last = last" class="px-1 py-1.5" [class.border-b]="!last" [class.border-gray-200]="!last" [class.dark:border-slate-700]="!last">
                <p class="text-[11px] font-semibold text-gray-600 dark:text-gray-300">{{ noteSummary(note) }}</p>
                <p class="mt-0.5 whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200">{{ noteBody(note) }}</p>
              </div>
            </div>
            <ng-template #noNotes>
              <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">No notes yet.</p>
            </ng-template>
          </div>

          <div class="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-slate-700 dark:bg-slate-900/40">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">AI Analysis</p>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">Get a quick risk summary and practical next actions for this field.</p>
              </div>
              <span *ngIf="analysisResult" class="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide" [ngStyle]="riskStyle(analysisResult.riskLevel)">
                {{ analysisResult.riskLevel }} risk
              </span>
            </div>

            <div *ngIf="analysisError" class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
              {{ analysisError }}
            </div>

            <div *ngIf="analysisResult; else emptyAnalysis" class="mt-3 space-y-3">
              <p class="text-sm leading-6 text-gray-700 dark:text-gray-200">{{ analysisResult.summary }}</p>

              <div *ngIf="analysisResult.concerns.length" class="space-y-1">
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Concerns</p>
                <ul class="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-200">
                  <li *ngFor="let concern of analysisResult.concerns">{{ concern }}</li>
                </ul>
              </div>

              <div *ngIf="analysisResult.recommendedActions.length" class="space-y-1">
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Recommended Actions</p>
                <ul class="list-disc space-y-1 pl-5 text-sm text-gray-700 dark:text-gray-200">
                  <li *ngFor="let action of analysisResult.recommendedActions">{{ action }}</li>
                </ul>
              </div>

              <p *ngIf="analysisResult.followUpQuestion" class="text-sm font-medium text-gray-700 dark:text-gray-200">
                {{ analysisResult.followUpQuestion }}
              </p>

              <p class="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500">Source: {{ analysisSource || 'gemini' }}</p>
            </div>

            <ng-template #emptyAnalysis>
              <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">Click “Analyze with AI” to generate a field summary.</p>
            </ng-template>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class FieldViewModalComponent {
  @Input() visible = false;
  @Input() field: Field | null = null;
  @Input() agentNameResolver: (agentId: string) => string = () => 'Unassigned';
  @Input() analysisResult: FieldAiInsights | null = null;
  @Input() analysisLoading = false;
  @Input() analysisSource: 'gemini' | 'fallback' | '' = '';
  @Input() analysisError = '';

  @Output() closed = new EventEmitter<void>();
  @Output() analyzeRequested = new EventEmitter<void>();

  stageLabel(stage: FieldStage): string {
    return stage.charAt(0).toUpperCase() + stage.slice(1);
  }

  statusLabel(status: FieldStatus): string {
    if (status === 'at_risk') {
      return 'At Risk';
    }

    if (status === 'completed') {
      return 'Completed';
    }

    return 'Active';
  }

  stageStyle(stage: FieldStage): Record<string, string> {
    if (stage === 'planted') {
      return {
        'background-color': '#ecfeff',
        color: '#155e75',
      };
    }

    if (stage === 'growing') {
      return {
        'background-color': '#ecfccb',
        color: '#365314',
      };
    }

    if (stage === 'ready') {
      return {
        'background-color': '#fef3c7',
        color: '#92400e',
      };
    }

    return {
      'background-color': '#e2e8f0',
      color: '#334155',
    };
  }

  statusStyle(status: FieldStatus): Record<string, string> {
    if (status === 'at_risk') {
      return {
        'background-color': '#ffedd5',
        color: '#9a3412',
      };
    }

    if (status === 'completed') {
      return {
        'background-color': '#e2e8f0',
        color: '#334155',
      };
    }

    return {
      'background-color': '#dcfce7',
      color: '#166534',
    };
  }

  riskStyle(riskLevel: 'low' | 'medium' | 'high'): Record<string, string> {
    if (riskLevel === 'high') {
      return {
        'background-color': '#fee2e2',
        color: '#991b1b',
      };
    }

    if (riskLevel === 'medium') {
      return {
        'background-color': '#fef3c7',
        color: '#92400e',
      };
    }

    return {
      'background-color': '#dcfce7',
      color: '#166534',
    };
  }

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
}
