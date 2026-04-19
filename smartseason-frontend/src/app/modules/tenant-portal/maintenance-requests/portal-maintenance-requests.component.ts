import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaintenanceRequestsService, MaintenanceRequest, CreateMaintenanceRequestDto } from '../../../shared/services/maintenance-requests/maintenance-requests.service';
import { TenantPortalAuthService } from '../shared/services/tenant-portal-auth.service';

@Component({
  selector: 'app-portal-maintenance-requests',
  templateUrl: './portal-maintenance-requests.component.html',
  styleUrls: ['./portal-maintenance-requests.component.scss'],
  standalone: false,
})
export class PortalMaintenanceRequestsComponent implements OnInit {
  requests: MaintenanceRequest[] = [];
  selectedRequest: MaintenanceRequest | null = null;
  loading = false;
  submitting = false;
  showNewRequest = false;
  selectedStatus: string = '';

  stats: { pending: number; inProgress: number; resolved: number; total: number } | null = null;

  newRequest: CreateMaintenanceRequestDto = {
    unitId: '',
    propertyId: '',
    title: '',
    description: '',
    priority: 'medium',
  };

  constructor(
    private maintenanceService: MaintenanceRequestsService,
    private auth: TenantPortalAuthService,
  ) {}

  ngOnInit(): void {
    this.loadRequests();
    this.loadStats();
  }

  loadRequests(status?: string): void {
    this.loading = true;
    this.maintenanceService.getAll(1, 20, status).subscribe({
      next: (response: any) => {
        this.requests = response.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadStats(): void {
    this.maintenanceService.getStats().subscribe({
      next: (stats: any) => {
        this.stats = stats;
      },
    });
  }

  filterByStatus(): void {
    this.loadRequests(this.selectedStatus || undefined);
  }

  viewRequest(request: MaintenanceRequest): void {
    this.selectedRequest = request;
  }

  submitRequest(): void {
    if (!this.newRequest.title || !this.newRequest.description) {
      return;
    }

    this.submitting = true;
    const profile = this.auth.getProfile();

    // Set unit and property from profile if not already set
    if (!this.newRequest.unitId && profile && (profile as any).unitId) {
      this.newRequest.unitId = (profile as any).unitId;
    }
    if (!this.newRequest.propertyId && profile && (profile as any).propertyId) {
      this.newRequest.propertyId = (profile as any).propertyId;
    }

    this.maintenanceService.create(this.newRequest).subscribe({
      next: () => {
        this.showNewRequest = false;
        this.newRequest = {
          unitId: '',
          propertyId: '',
          title: '',
          description: '',
          priority: 'medium',
        };
        this.submitting = false;
        this.loadRequests();
        this.loadStats();
      },
      error: () => {
        this.submitting = false;
      },
    });
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      closed: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return classes[status] || classes['pending'];
  }

  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      low: 'text-gray-600 dark:text-gray-400',
      medium: 'text-blue-600 dark:text-blue-400',
      high: 'text-orange-600 dark:text-orange-400',
      urgent: 'text-red-600 dark:text-red-400 font-semibold',
    };
    return classes[priority] || '';
  }
}
