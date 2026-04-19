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
    this.loading = true;
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
}
