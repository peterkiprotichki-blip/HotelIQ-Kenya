import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import jsPDF from 'jspdf';
import { AuthService } from '../../shared/services/auth/auth.service';
import { ConfirmationService } from '../../shared/services/confirmation.service';
import { NotificationService } from '../../shared/services/notification.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { UsersService } from '../../shared/services/users/users.service';
import { BomoproUser } from '../../shared/interfaces/models';
import { FieldsService, Field, FieldAiInsights, FieldStage } from '../../shared/services/fields/fields.service';
import { FieldCreateModalComponent, CreateFieldFormValue } from './field-create-modal.component';
import { FieldNoteModalComponent, CreateFieldNoteValue } from './field-note-modal.component';
import { FieldViewModalComponent } from './field-view-modal.component';
import { FieldsListComponent } from './fields-list.component';

Chart.register(...registerables);

@Component({
  selector: 'app-fields',
  standalone: true,
  imports: [CommonModule, FieldCreateModalComponent, FieldsListComponent, FieldNoteModalComponent, FieldViewModalComponent],
  templateUrl: './fields.component.html',
})
export class FieldsComponent implements OnInit, OnDestroy {
  fields: Field[] = [];
  agents: BomoproUser[] = [];
  loading = true;
  loadingAgents = false;
  creatingField = false;
  creatingNote = false;
  savingField = false;
  analyzingField = false;
  analyzingAllFields = false;
  error = '';
  aiError = '';
  allFieldsAiError = '';
  showCreateModal = false;
  showNoteModal = false;
  showViewModal = false;
  showAllFieldsAnalysisModal = false;
  selectedFieldForNote: Field | null = null;
  selectedFieldForEdit: Field | null = null;
  selectedFieldForView: Field | null = null;
  fieldEditInitialValue: Partial<CreateFieldFormValue> | null = null;
  fieldAiAnalysis: FieldAiInsights | null = null;
  fieldAiSource: 'gemini' | 'fallback' | '' = '';
  allFieldsAnalysis: Array<{
    field: Field;
    insights: FieldAiInsights;
    source: 'gemini' | 'fallback';
    model: string;
  }> = [];
  allFieldsAnalysisSummary = '';
  allFieldsRiskCounts = {
    low: 0,
    medium: 0,
    high: 0,
  };

  @ViewChild('allFieldsRiskChart') allFieldsRiskChart?: ElementRef<HTMLCanvasElement>;
  private allFieldsRiskChartInstance: Chart | null = null;

  updateDraft: Record<string, { stage: FieldStage; note: string }> = {};

  readonly stages: FieldStage[] = ['planted', 'growing', 'ready', 'harvested'];

  constructor(
    private readonly fieldsService: FieldsService,
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly confirmationService: ConfirmationService,
    private readonly notificationService: NotificationService,
    public readonly themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.loadFields();
    if (this.isAdminLike) {
      this.loadAgents();
    }
  }

  ngOnDestroy(): void {
    this.destroyAllFieldsChart();
  }

  get userRole(): string {
    return this.authService.getUser()?.role || '';
  }

  get isAdminLike(): boolean {
    return this.userRole === 'admin';
  }

  openCreateFieldModal(): void {
    this.selectedFieldForEdit = null;
    this.fieldEditInitialValue = null;
    this.showCreateModal = true;
  }

  loadFields(): void {
    this.loading = true;
    this.error = '';
    this.fieldsService.getAll().subscribe({
      next: (res) => {
        this.fields = res;
        this.fields.forEach((field) => {
          if (!this.updateDraft[field._id]) {
            this.updateDraft[field._id] = {
              stage: field.currentStage,
              note: '',
            };
          }
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load fields';
        this.loading = false;
      },
    });
  }

  createField(payload: CreateFieldFormValue): void {
    this.savingField = true;
    this.error = '';
    const isEditMode = Boolean(this.selectedFieldForEdit);
    const request$ = this.selectedFieldForEdit
      ? this.fieldsService.update(this.selectedFieldForEdit._id, {
          name: payload.name.trim(),
          cropType: payload.cropType.trim(),
          plantingDate: payload.plantingDate,
          expectedHarvestDate: payload.expectedHarvestDate || undefined,
          assignedAgentId: payload.assignedAgentId,
          location: payload.location?.trim() || undefined,
          currentStage: this.selectedFieldForEdit.currentStage,
        })
      : this.fieldsService.create({
          name: payload.name.trim(),
          cropType: payload.cropType.trim(),
          plantingDate: payload.plantingDate,
          expectedHarvestDate: payload.expectedHarvestDate || undefined,
          assignedAgentId: payload.assignedAgentId,
          location: payload.location?.trim() || undefined,
        });

    request$.subscribe({
      next: () => {
        this.savingField = false;
        this.showCreateModal = false;
        this.selectedFieldForEdit = null;
        this.loadFields();
        this.notificationService.success(isEditMode ? 'Field updated successfully' : 'Field created successfully');
      },
      error: (err) => {
        this.savingField = false;
        this.error = err?.error?.message || (this.selectedFieldForEdit ? 'Failed to update field' : 'Failed to create field');
      },
    });
  }

  onStageChanged(event: { field: Field; stage: FieldStage }): void {
    this.error = '';
    this.fieldsService
      .addUpdate(event.field._id, {
        stage: event.stage,
        note: `Stage updated to ${event.stage}`,
      })
      .subscribe({
        next: () => {
          this.loadFields();
        },
        error: (err) => {
          this.error = err?.error?.message || 'Failed to update stage';
          this.updateDraft[event.field._id] = {
            stage: event.field.currentStage,
            note: this.updateDraft[event.field._id]?.note || '',
          };
        },
      });
  }

  onAddNote(field: Field): void {
    this.selectedFieldForNote = field;
    this.showNoteModal = true;
  }

  saveNote(payload: CreateFieldNoteValue): void {
    if (!this.selectedFieldForNote) {
      return;
    }

    this.creatingNote = true;
    this.error = '';
    this.fieldsService
      .addUpdate(this.selectedFieldForNote._id, {
        note: payload.note,
      })
      .subscribe({
        next: () => {
          this.creatingNote = false;
          this.showNoteModal = false;
          this.selectedFieldForNote = null;
          this.loadFields();
          this.notificationService.success('Note saved successfully');
        },
        error: (err) => {
          this.creatingNote = false;
          this.error = err?.error?.message || 'Failed to add note';
        },
      });
  }

  onEditField(field: Field): void {
    if (!this.isAdminLike) {
      return;
    }

    this.selectedFieldForEdit = field;
    this.fieldEditInitialValue = {
      name: field.name,
      cropType: field.cropType,
      plantingDate: field.plantingDate,
      expectedHarvestDate: field.expectedHarvestDate,
      assignedAgentId: field.assignedAgentId,
      location: field.location,
    };
    this.showCreateModal = true;
  }

  onDeleteField(field: Field): void {
    if (!this.isAdminLike) {
      return;
    }

    this.confirmationService
      .confirm({
        title: 'Delete Field',
        message: `Delete field "${field.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      })
      .then((confirmed) => {
        if (!confirmed) {
          return;
        }

        this.fieldsService.remove(field._id).subscribe({
          next: () => {
            this.loadFields();
            this.notificationService.success('Field deleted successfully');
          },
          error: (err) => {
            this.error = err?.error?.message || 'Failed to delete field';
          },
        });
      });
  }

  onViewField(field: Field): void {
    this.selectedFieldForView = field;
    this.showViewModal = true;
    this.fieldAiAnalysis = null;
    this.fieldAiSource = '';
    this.aiError = '';
  }

  onAnalyzeField(field: Field): void {
    this.selectedFieldForView = field;
    this.showViewModal = true;
    this.fieldAiAnalysis = null;
    this.fieldAiSource = '';
    this.aiError = '';
    this.analyzeSelectedField();
  }

  analyzeAllFields(): void {
    if (this.analyzingAllFields || !this.fields.length) {
      return;
    }

    this.analyzingAllFields = true;
    this.allFieldsAiError = '';
    this.allFieldsAnalysis = [];
    this.allFieldsAnalysisSummary = '';
    this.showAllFieldsAnalysisModal = true;

    forkJoin(this.fields.map((field) => this.fieldsService.analyze(field._id, 'Give me the top risks and next actions for this field.'))).subscribe({
      next: (results) => {
        this.allFieldsAnalysis = results
          .map((result) => ({
            field: result.field,
            insights: result.insights,
            source: result.source,
            model: result.model,
          }))
          .sort((left, right) => this.riskRank(right.insights.riskLevel) - this.riskRank(left.insights.riskLevel));

        this.allFieldsRiskCounts = this.allFieldsAnalysis.reduce(
          (accumulator, item) => {
            accumulator[item.insights.riskLevel as 'low' | 'medium' | 'high'] += 1;
            return accumulator;
          },
          { low: 0, medium: 0, high: 0 },
        );

        this.allFieldsAnalysisSummary = `Analyzed ${this.allFieldsAnalysis.length} fields. ${this.allFieldsRiskCounts.high} high risk, ${this.allFieldsRiskCounts.medium} medium risk, and ${this.allFieldsRiskCounts.low} low risk.`;
        this.analyzingAllFields = false;
        this.scheduleAllFieldsChartRender();
        this.notificationService.success('All fields analysis complete');
      },
      error: (err) => {
        this.analyzingAllFields = false;
        this.allFieldsAiError = err?.error?.message || 'Failed to analyze all fields';
      },
    });
  }

  closeAllFieldsAnalysis(): void {
    this.showAllFieldsAnalysisModal = false;
    this.analyzingAllFields = false;
    this.destroyAllFieldsChart();
  }

  onViewModalClosed(): void {
    this.showViewModal = false;
    this.selectedFieldForView = null;
    this.fieldAiAnalysis = null;
    this.fieldAiSource = '';
    this.aiError = '';
    this.analyzingField = false;
  }

  analyzeSelectedField(): void {
    if (!this.selectedFieldForView || this.analyzingField) {
      return;
    }

    this.analyzingField = true;
    this.aiError = '';
    this.fieldsService.analyze(this.selectedFieldForView._id, 'Give me the top risks and next actions for this field.').subscribe({
      next: (res) => {
        this.fieldAiAnalysis = res.insights;
        this.fieldAiSource = res.source;
        this.analyzingField = false;
        this.notificationService.success('AI analysis complete');
      },
      error: (err) => {
        this.analyzingField = false;
        this.aiError = err?.error?.message || 'Failed to analyze field';
      },
    });
  }

  onModalClosed(): void {
    this.showCreateModal = false;
    this.selectedFieldForEdit = null;
    this.fieldEditInitialValue = null;
  }

  get fieldModalMode(): 'create' | 'edit' {
    return this.selectedFieldForEdit ? 'edit' : 'create';
  }

  loadAgents(): void {
    this.loadingAgents = true;
    this.usersService.getAll(1, 200).subscribe({
      next: (res) => {
        this.agents = (res.data || []).filter((user) => user.role === 'agent' && user.isActive);
        this.loadingAgents = false;
      },
      error: () => {
        this.loadingAgents = false;
      },
    });
  }

  getAgentName(agentId: string): string {
    const match = this.agents.find((agent) => agent._id === agentId);
    return match ? match.name : 'Unassigned';
  }

  riskRank(level: 'low' | 'medium' | 'high'): number {
    if (level === 'high') {
      return 3;
    }

    if (level === 'medium') {
      return 2;
    }

    return 1;
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

  downloadAllFieldsPdf(): void {
    if (!this.allFieldsAnalysis.length) {
      return;
    }

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let cursorY = margin;

    const ensureSpace = (requiredHeight: number): void => {
      if (cursorY + requiredHeight <= pageHeight - margin) {
        return;
      }

      pdf.addPage();
      cursorY = margin;
    };

    const riskColors: Record<'low' | 'medium' | 'high', [number, number, number]> = {
      low: [22, 163, 74],
      medium: [217, 119, 6],
      high: [185, 28, 28],
    };

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('Fields AI Analysis Report', margin, cursorY);
    cursorY += 18;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(75, 85, 99);
    pdf.text(`Generated on ${new Date().toLocaleString()}`, margin, cursorY);
    cursorY += 24;

    pdf.setDrawColor(226, 232, 240);
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, cursorY, contentWidth, 70, 10, 10, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(15, 23, 42);
    pdf.text('Summary', margin + 14, cursorY + 20);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const summaryLines = pdf.splitTextToSize(this.allFieldsAnalysisSummary, contentWidth - 28);
    pdf.text(summaryLines, margin + 14, cursorY + 36);
    cursorY += 86;

    const total = this.allFieldsAnalysis.length || 1;
    const bars: Array<{ label: string; value: number; key: 'low' | 'medium' | 'high' }> = [
      { label: 'High', value: this.allFieldsRiskCounts.high, key: 'high' },
      { label: 'Medium', value: this.allFieldsRiskCounts.medium, key: 'medium' },
      { label: 'Low', value: this.allFieldsRiskCounts.low, key: 'low' },
    ];

    ensureSpace(116);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Risk Distribution', margin, cursorY);
    cursorY += 10;

    bars.forEach((bar) => {
      const barWidth = Math.max(8, (bar.value / total) * (contentWidth - 90));
      const [red, green, blue] = riskColors[bar.key];
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(55, 65, 81);
      pdf.text(`${bar.label}`, margin, cursorY + 12);
      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(243, 244, 246);
      pdf.roundedRect(margin + 54, cursorY + 2, contentWidth - 54, 14, 4, 4, 'F');
      pdf.setFillColor(red, green, blue);
      pdf.roundedRect(margin + 54, cursorY + 2, barWidth, 14, 4, 4, 'F');
      pdf.setTextColor(17, 24, 39);
      pdf.text(String(bar.value), margin + contentWidth - 18, cursorY + 12, { align: 'right' });
      cursorY += 24;
    });

    cursorY += 10;

    this.allFieldsAnalysis.forEach((item, index) => {
      const sectionHeight = 110;
      ensureSpace(sectionHeight);

      if (index > 0 && cursorY > pageHeight - margin - sectionHeight) {
        pdf.addPage();
        cursorY = margin;
      }

      const [red, green, blue] = riskColors[item.insights.riskLevel];
      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, cursorY, contentWidth, sectionHeight, 12, 12, 'FD');

      pdf.setFillColor(red, green, blue);
      pdf.roundedRect(margin, cursorY, 8, sectionHeight, 12, 0, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text(item.field.name, margin + 16, cursorY + 20);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(75, 85, 99);
      pdf.text(`${item.field.cropType} · ${item.field.currentStage} · ${item.insights.riskLevel.toUpperCase()} risk`, margin + 16, cursorY + 34);

      const summaryText = pdf.splitTextToSize(item.insights.summary, contentWidth - 32);
      pdf.setTextColor(31, 41, 55);
      pdf.text(summaryText, margin + 16, cursorY + 50);

      const actionsText = item.insights.recommendedActions.slice(0, 2).join(' • ');
      if (actionsText) {
        const actionLines = pdf.splitTextToSize(`Actions: ${actionsText}`, contentWidth - 32);
        pdf.setTextColor(75, 85, 99);
        pdf.text(actionLines, margin + 16, cursorY + 72);
      }

      cursorY += sectionHeight + 12;
    });

    pdf.save(`fields-analysis-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  private scheduleAllFieldsChartRender(): void {
    window.setTimeout(() => this.renderAllFieldsChart(), 0);
  }

  private renderAllFieldsChart(): void {
    const canvas = this.allFieldsRiskChart?.nativeElement;
    if (!canvas) {
      return;
    }

    this.destroyAllFieldsChart();

    const config: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['High risk', 'Medium risk', 'Low risk'],
        datasets: [
          {
            data: [this.allFieldsRiskCounts.high, this.allFieldsRiskCounts.medium, this.allFieldsRiskCounts.low],
            backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'],
            borderColor: ['#fee2e2', '#fef3c7', '#dcfce7'],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
          },
        },
      },
    };

    this.allFieldsRiskChartInstance = new Chart(canvas, config);
  }

  private destroyAllFieldsChart(): void {
    this.allFieldsRiskChartInstance?.destroy();
    this.allFieldsRiskChartInstance = null;
  }
}
