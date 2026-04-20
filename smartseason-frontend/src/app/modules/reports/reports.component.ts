import { Component, OnDestroy, OnInit } from '@angular/core';
import { catchError, forkJoin, map, of } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { Field, FieldsService, FieldStats } from '../../shared/services/fields/fields.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { UsersService } from '../../shared/services/users/users.service';
import { BomoproUser } from '../../shared/interfaces/models';
import { ReportAiInsights, ReportsService } from '../../shared/services/reports/reports.service';

Chart.register(...registerables);

interface ReportChatMessage {
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit, OnDestroy {
  stats: FieldStats | null = null;
  fields: Field[] = [];
  agentBreakdown: Array<{ agentId: string; count: number }> = [];
  agentNameMap: Record<string, string> = {};
  loading = true;
  error = '';
  reportAnalysis: ReportAiInsights | null = null;
  reportAnalysisLoading = false;
  reportAnalysisError = '';
  reportAnalysisSource: 'gemini' | 'fallback' | '' = '';
  reportChatMessages: ReportChatMessage[] = [];
  reportChatSending = false;
  reportChatError = '';

  private statusChart: Chart | null = null;
  private stageChart: Chart | null = null;
  private agentChart: Chart | null = null;

  constructor(
    private fieldsService: FieldsService,
    private authService: AuthService,
    private usersService: UsersService,
    private reportsService: ReportsService,
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
      agents: this.usersService.getAll(1, 200).pipe(
        map((res) => (res.data || []).filter((user) => user.role === 'agent' && user.isActive)),
        catchError(() => of([] as BomoproUser[])),
      ),
    }).subscribe({
      next: ({ stats, fields, agents }) => {
        this.stats = stats;
        this.fields = fields;
        this.agentNameMap = this.buildAgentNameMap(agents);
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

  get hasReportAnalysis(): boolean {
    return Boolean(this.reportAnalysis);
  }

  analyzeReport(): void {
    if (!this.stats) {
      this.reportAnalysisError = 'Reports are still loading.';
      return;
    }

    this.reportAnalysisLoading = true;
    this.reportAnalysisError = '';
    this.reportChatError = '';

    this.reportsService.analyzeReport(this.buildReportFocus()).subscribe({
      next: (response) => {
        this.reportAnalysis = response.insights;
        this.reportAnalysisSource = response.source;
        this.reportAnalysisLoading = false;
        this.reportChatMessages = [
          {
            role: 'assistant',
            text: response.insights.followUpQuestion || 'Ask a follow-up about this report and I will refine the analysis.',
            time: this.formatChatTime(new Date()),
          },
        ];
      },
      error: (err) => {
        this.reportAnalysisError = err?.error?.message || 'Failed to analyze the report';
        this.reportAnalysisLoading = false;
      },
    });
  }

  sendReportChat(message: string): void {
    const prompt = message.trim();
    if (!prompt) {
      return;
    }

    this.reportChatSending = true;
    this.reportChatError = '';
    this.reportChatMessages = [
      ...this.reportChatMessages,
      {
        role: 'user',
        text: prompt,
        time: this.formatChatTime(new Date()),
      },
    ];

    this.reportsService.analyzeReport(this.buildReportFollowUpFocus(prompt)).subscribe({
      next: (response) => {
        this.reportAnalysis = response.insights;
        this.reportAnalysisSource = response.source;
        this.reportChatMessages = [
          ...this.reportChatMessages,
          {
            role: 'assistant',
            text: this.formatReportAssistantMessage(response.insights),
            time: this.formatChatTime(new Date()),
          },
        ];
        this.reportChatSending = false;
      },
      error: (err) => {
        this.reportChatError = err?.error?.message || 'Failed to send report question';
        this.reportChatSending = false;
      },
    });
  }

  onReportChatEnter(event: Event, input: HTMLTextAreaElement): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key === 'Enter' && !keyboardEvent.shiftKey) {
      event.preventDefault();
      this.sendReportChatFromInput(input);
    }
  }

  sendReportChatFromInput(input: HTMLTextAreaElement): void {
    const message = input.value.trim();
    if (!message) {
      return;
    }

    this.sendReportChat(message);
    input.value = '';
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

  private buildAgentNameMap(agents: BomoproUser[]): Record<string, string> {
    const map: Record<string, string> = {};
    agents.forEach((agent) => {
      if (agent._id) {
        map[agent._id] = agent.name || 'Unknown Agent';
      }
    });

    const currentUser = this.authService.getUser();
    if (currentUser?._id && currentUser?.name && !map[currentUser._id]) {
      map[currentUser._id] = currentUser.name;
    }

    return map;
  }

  private buildReportFocus(userFollowUp?: string): string {
    const summary = {
      totalFields: this.stats?.totalFields || 0,
      statusBreakdown: this.stats?.statusBreakdown,
      stageBreakdown: this.stats?.stageBreakdown,
      atRiskFields: this.stats?.atRiskFields || [],
      totalNotes: this.totalNotes,
      agentBreakdown: this.agentBreakdown.map((item) => ({
        agent: this.getAgentLabel(item.agentId),
        count: item.count,
      })),
    };

    return [
      'Analyze this SmartSeason report dashboard and summarize the overall field health, risks, and priorities.',
      `Current report summary:\n${JSON.stringify(summary, null, 2)}`,
      userFollowUp ? `User follow-up question: ${userFollowUp}` : '',
    ].filter(Boolean).join('\n\n');
  }

  private buildReportFollowUpFocus(userFollowUp: string): string {
    const currentAnalysis = this.reportAnalysis
      ? {
          summary: this.reportAnalysis.summary,
          riskLevel: this.reportAnalysis.riskLevel,
          concerns: this.reportAnalysis.concerns,
          recommendedActions: this.reportAnalysis.recommendedActions,
        }
      : null;

    return [
      'Continue the SmartSeason report analysis with the new user question.',
      `Current report summary:\n${JSON.stringify({
        totalFields: this.stats?.totalFields || 0,
        statusBreakdown: this.stats?.statusBreakdown,
        stageBreakdown: this.stats?.stageBreakdown,
        atRiskFields: this.stats?.atRiskFields || [],
        totalNotes: this.totalNotes,
        agentBreakdown: this.agentBreakdown.map((item) => ({
          agent: this.getAgentLabel(item.agentId),
          count: item.count,
        })),
      }, null, 2)}`,
      currentAnalysis ? `Current AI summary:\n${JSON.stringify(currentAnalysis, null, 2)}` : '',
      `User follow-up question: ${userFollowUp}`,
    ].filter(Boolean).join('\n\n');
  }

  private formatReportAssistantMessage(insights: ReportAiInsights): string {
    const parts: string[] = [insights.summary];

    if (insights.concerns.length) {
      parts.push(`Concerns: ${insights.concerns.join(' ')}`);
    }

    if (insights.recommendedActions.length) {
      parts.push(`Actions: ${insights.recommendedActions.join(' ')}`);
    }

    if (insights.followUpQuestion) {
      parts.push(`Next: ${insights.followUpQuestion}`);
    }

    return parts.join('\n\n');
  }

  private formatChatTime(value: Date): string {
    return value.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  private getAgentLabel(agentId: string): string {
    if (agentId === 'unassigned') {
      return 'Unassigned';
    }

    return this.agentNameMap[agentId] || 'Unknown Agent';
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
        labels: topAgents.map((a) => this.getAgentLabel(a.agentId)),
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
