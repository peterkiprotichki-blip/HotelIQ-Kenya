import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { FieldStats, FieldsService } from '../../shared/services/fields/fields.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  stats: FieldStats | null = null;
  loading = true;
  error = '';

  constructor(
    private fieldsService: FieldsService,
    public themeService: ThemeService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = '';
    this.fieldsService.getStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load field insights';
        this.loading = false;
      },
    });
  }

  get roleLabel(): string {
    const role = this.authService.getUser()?.role || '';
    return role === 'agent' ? 'Field Agent' : 'Admin Coordinator';
  }

  get isAgent(): boolean {
    return this.authService.getUser()?.role === 'agent';
  }

  get completionPercent(): number {
    if (!this.stats?.totalFields) {
      return 0;
    }

    return Math.round((this.stats.statusBreakdown.completed / this.stats.totalFields) * 100);
  }

  statusPercent(status: 'active' | 'atRisk' | 'completed'): number {
    if (!this.stats?.totalFields) {
      return 0;
    }

    return Math.round((this.stats.statusBreakdown[status] / this.stats.totalFields) * 100);
  }

  stagePercent(stage: 'planted' | 'growing' | 'ready' | 'harvested'): number {
    if (!this.stats?.totalFields) {
      return 0;
    }

    return Math.round((this.stats.stageBreakdown[stage] / this.stats.totalFields) * 100);
  }
}
