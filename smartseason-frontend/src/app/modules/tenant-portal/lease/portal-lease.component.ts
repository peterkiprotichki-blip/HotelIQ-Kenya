import { Component, OnInit } from '@angular/core';
import { TenantPortalService } from '../shared/services/tenant-portal.service';
import { PortalLease } from '../shared/interfaces/portal.interfaces';

@Component({
  selector: 'app-portal-lease',
  templateUrl: './portal-lease.component.html',
  styleUrls: ['./portal-lease.component.scss'],
})
export class PortalLeaseComponent implements OnInit {
  lease: PortalLease | null = null;
  loading = true;
  signing = false;
  signed = false;
  error = '';
  showSignModal = false;

  constructor(private portalService: TenantPortalService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.portalService.getLease().subscribe({
      next: (lease) => {
        this.lease = lease;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to load lease.';
        this.loading = false;
      },
    });
  }

  openSignModal() {
    this.showSignModal = true;
  }

  confirmSign() {
    if (!this.lease) return;
    this.signing = true;
    this.showSignModal = false;
    this.portalService.signLease(this.lease._id).subscribe({
      next: (updated) => {
        this.lease = updated;
        this.signed = true;
        this.signing = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to sign lease.';
        this.signing = false;
      },
    });
  }
}
