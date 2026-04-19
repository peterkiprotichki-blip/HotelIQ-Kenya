import { Component, OnDestroy, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { Field, FieldsService, FieldStats } from '../../shared/services/fields/fields.service';
import { AuthService } from '../../shared/services/auth/auth.service';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit, OnDestroy {
  stats: FieldStats | null = null;
  fields: Field[] = [];
  agentBreakdown: Array<{ agentId: string; count: number }> = [];
  loading = true;
  error = '';

  private statusChart: Chart | null = null;
  private stageChart: Chart | null = null;
  private agentChart: Chart | null = null;

  constructor(
    private fieldsService: FieldsService,
    private authService: AuthService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.loadReports();
  }

  ngOnDestroy(): void {
    this.statusChart?.destroy();
    this.stageChart?.destroy();
    this.agentChart?.destroy();
  }

  loadReports(): void {
    this.loading = true;
    this.error = '';

    forkJoin({
      stats: this.fieldsService.getStats(),
      fields: this.fieldsService.getAll(),
    }).subscribe({
      next: ({ stats, fields }) => {
        this.stats = stats;
        this.fields = fields;
        this.agentBreakdown = this.buildAgentBreakdown(fields);
        this.loading = false;
        setTimeout(() => {
          this.buildStatusChart();
          this.buildStageChart();
          this.buildAgentChart();
        }, 80);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load reports';
        this.loading = false;
      },
    });
  }

  get roleLabel(): string {
    return this.authService.getUser()?.role === 'agent' ? 'Field Agent View' : 'Admin Coordinator View';
  }

  get totalNotes(): number {
    return this.fields.reduce((sum, field) => sum + (field.notes?.length || 0), 0);
  }

  private buildAgentBreakdown(fields: Field[]): Array<{ agentId: string; count: number }> {
    const map = new Map<string, number>();
    fields.forEach((field) => {
      const key = field.assignedAgentId || 'unassigned';
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries())
      .map(([agentId, count]) => ({ agentId, count }))
      .sort((a, b) => b.count - a.count);
  }

  private isDark(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  private get tickColor(): string { return this.isDark() ? '#9ca3af' : '#6b7280'; }
  private get gridColor(): string { return this.isDark() ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'; }

  private buildStatusChart(): void {
    const canvas = document.getElementById('statusChart') as HTMLCanvasElement;
    if (!canvas || !this.stats) return;
    this.statusChart?.destroy();
    this.statusChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['Active', 'At Risk', 'Completed'],
        datasets: [{
          data: [
            this.stats.statusBreakdown.active,
            this.stats.statusBreakdown.atRisk,
            this.stats.statusBreakdown.completed,
          ],
          backgroundColor: ['#22c55e', '#f59e0b', '#3b82f6'],
          borderWidth: 2,
          borderColor: this.isDark() ? '#1e293b' : '#ffffff',
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: { position: 'bottom', labels: { color: this.tickColor, padding: 14, font: { size: 12 } } },
        },
      },
    });
  }

  private buildStageChart(): void {
    const canvas = document.getElementById('stageChart') as HTMLCanvasElement;
    if (!canvas || !this.stats) return;
    this.stageChart?.destroy();
    this.stageChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Planted', 'Growing', 'Ready', 'Harvested'],
        datasets: [{
          data: [
            this.stats.stageBreakdown.planted,
            this.stats.stageBreakdown.growing,
            this.stats.stageBreakdown.ready,
            this.stats.stageBreakdown.harvested,
          ],
          backgroundColor: ['#16a34a', '#0ea5e9', '#f59e0b', '#6366f1'],
          borderRadius: 8,
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: this.tickColor, precision: 0 },
            grid: { color: this.gridColor },
            border: { display: false },
          },
          x: {
            ticks: { color: this.tickColor },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
    });
  }

  private buildAgentChart(): void {
    const canvas = document.getElementById('agentChart') as HTMLCanvasElement;
    if (!canvas || !this.agentBreakdown.length) return;
    this.agentChart?.destroy();
    const topAgents = this.agentBreakdown.slice(0, 8);
    this.agentChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: topAgents.map((a) => a.agentId),
        datasets: [{
          data: topAgents.map((a) => a.count),
          backgroundColor: this.themeService.accent + 'cc',
          borderColor: this.themeService.accent,
          borderWidth: 1,
          borderRadius: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: this.tickColor, precision: 0 },
            grid: { color: this.gridColor },
            border: { display: false },
          },
          y: {
            ticks: { color: this.tickColor },
            grid: { display: false },
            border: { display: false },
          },
        },
      },
    });
  }
}
