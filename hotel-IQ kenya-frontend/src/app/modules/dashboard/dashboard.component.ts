import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardSummary } from '../../shared/services/dashboard/dashboard.service';
import { EventsService } from '../../shared/services/events/events.service';
import { PropertiesService } from '../../shared/services/properties/properties.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { MapComponent } from '../../shared/components/map/map.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, MapComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummary | null = null;
  events: any[] = [];
  loading = true;
  error = '';

  propertyLatitude = -4.0253;
  propertyLongitude = 39.7123;
  propertyName = 'Mombasa Ocean Breeze Lodge';

  constructor(
    private readonly dashboardService: DashboardService,
    private readonly eventsService: EventsService,
    private readonly propertiesService: PropertiesService,
    private readonly authService: AuthService,
    public readonly themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  get propertyId(): string {
    return this.authService.getActiveTenantId();
  }

  loadDashboardData(): void {
    if (!this.propertyId) {
      this.error = 'No active property found. Please configure property coordinates in Settings first.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = '';

    // Load Property coordinates
    this.propertiesService.getById(this.propertyId).subscribe({
      next: (prop: any) => {
        this.propertyName = prop.name;
        this.propertyLatitude = prop.latitude;
        this.propertyLongitude = prop.longitude;

        // Load Summary metrics
        this.dashboardService.getSummary(this.propertyId).subscribe({
          next: (summary) => {
            this.summary = summary;

            // Load nearby events (50km radius)
            const near = `${prop.latitude},${prop.longitude}`;
            this.eventsService.getAll(near, 50).subscribe({
              next: (events) => {
                this.events = events;
                this.loading = false;
              },
              error: () => {
                this.loading = false;
              }
            });
          },
          error: (err) => {
            this.error = err?.error?.message || 'Failed to load dashboard metrics';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load property details';
        this.loading = false;
      }
    });
  }

  get roleLabel(): string {
    const role = this.authService.getUser()?.role || '';
    return role === 'agent' ? 'Receptionist Agent' : 'Hotel Owner';
  }
}
