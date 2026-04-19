import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Lease, PropertyTenant } from '../../../shared/interfaces/models';
import { LeasesService } from '../../../shared/services/leases/leases.service';
import { UnitsService } from '../../../shared/services/units/units.service';
import { PropertiesService } from '../../../shared/services/properties/properties.service';
import { PropertyTenantsService } from '../../../shared/services/property-tenants/property-tenants.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-lease-form',
  templateUrl: './lease-form.component.html',
  styleUrls: ['./lease-form.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule],
  animations: [
    trigger('fadeIn', [transition(':enter', [style({ opacity: 0 }), animate('300ms ease-in', style({ opacity: 1 }))])]),
    trigger('slideDown', [transition(':enter', [style({ transform: 'translateY(-20px)', opacity: 0 }), animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))])]),
  ],
})
export class LeaseFormComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() lease: Lease | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Lease>();

  form: Partial<Lease> = this.initializeForm();
  properties: any[] = [];
  units: any[] = [];
  availableUnits: any[] = [];
  tenants: PropertyTenant[] = [];
  filteredTenants: PropertyTenant[] = [];
  showTenantDropdown = false;
  showCreateTenant = false;
  tenantSearchQuery = '';
  loading = false;
  submitted = false;
  tenantWithActiveLeaseError = false;
  newTenantForm = {
    name: '',
    idNumber: '',
    phone: '',
    email: '',
  };
  newTenantLoading = false;

  paymentFrequencyOptions = ['monthly', 'quarterly', 'semi_annually', 'annually'];
  statuses = ['draft', 'active', 'pending', 'terminated', 'expired'];
  damageTypes = ['structural', 'plumbing', 'electrical', 'appliance', 'cosmetic', 'fixture', 'flooring', 'window_door', 'other'];
  damageSeverities = ['low', 'medium', 'high', 'critical'];

  constructor(
    private leasesService: LeasesService,
    private unitsService: UnitsService,
    private propertiesService: PropertiesService,
    private propertyTenantsService: PropertyTenantsService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.loadProperties();
    this.loadTenants();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && changes['isOpen'].currentValue) {
      if (this.lease) {
        this.form = { ...this.lease };
        this.tenantSearchQuery = this.getTenantDisplayName(this.form.propertyTenantId || '');
      } else {
        this.form = this.initializeForm();
        this.tenantSearchQuery = '';
      }
      this.submitted = false;
      this.tenantWithActiveLeaseError = false;
    }
  }

  initializeForm(): Partial<Lease> {
    return {
      propertyId: '',
      unitId: '',
      propertyTenantId: '',
      tenantId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      rentAmount: 0,
      depositAmount: 0,
      currency: 'KES',
      paymentFrequency: 'monthly',
      paymentDueDay: 5,
      lateFeeAmount: 0,
      gracePeriodDays: 5,
      notes: '',
    };
  }

  loadProperties(): void {
    this.propertiesService.getAll(1, 100).subscribe({
      next: (res) => (this.properties = res.data),
      error: (err) => console.error('Error loading properties:', err),
    });
  }

  loadTenants(): void {
    this.propertyTenantsService.getAll(1, 1000).subscribe({
      next: (res) => {
        this.tenants = res.data;
        this.filteredTenants = res.data;
      },
      error: (err) => console.error('Error loading tenants:', err),
    });
  }

  onPropertyChange(): void {
    if (!this.form.propertyId) {
      this.units = [];
      this.availableUnits = [];
      return;
    }

    this.unitsService.findAvailableByProperty(this.form.propertyId).subscribe({
      next: (units) => {
        this.availableUnits = units;
      },
      error: (err) => console.error('Error loading units:', err),
    });
  }

  searchTenants(query: string): void {
    this.tenantSearchQuery = query;
    if (!query.trim()) {
      this.filteredTenants = this.tenants;
      return;
    }

    const lowerQuery = query.toLowerCase();
    this.filteredTenants = this.tenants.filter(
      t => 
        t.name.toLowerCase().includes(lowerQuery) ||
        t.phone.includes(query) ||
        t.idNumber.includes(query)
    );
  }

  selectTenant(tenant: PropertyTenant): void {
    this.form.propertyTenantId = tenant._id;
    this.tenantSearchQuery = this.getTenantDisplayName(tenant._id);
    this.showTenantDropdown = false;
    this.tenantWithActiveLeaseError = false;

    // Check if tenant has active lease
    if (tenant.currentLeaseId) {
      this.tenantWithActiveLeaseError = true;
    }
  }

  getTenantDisplayName(tenantId: string): string {
    const tenant = this.tenants.find(t => t._id === tenantId);
    return tenant ? `${tenant.name} (${tenant.phone})` : '';
  }

  onUnitChange(): void {
    if (!this.form.unitId) return;

    const selectedUnit = this.availableUnits.find(u => u._id === this.form.unitId);
    if (selectedUnit) {
      this.form.rentAmount = selectedUnit.rentAmount;
      this.form.depositAmount = selectedUnit.securityDeposit || 0;
      this.form.currency = selectedUnit.currency || 'KES';
      this.form.propertyId = selectedUnit.propertyId;
    }
  }

  onSubmit(): void {
    this.submitted = true;

    if (!this.form.propertyId || !this.form.unitId || !this.form.propertyTenantId || !this.form.startDate) {
      return;
    }

    if (this.tenantWithActiveLeaseError) {
      console.warn('Tenant already has an active lease');
      return;
    }

    this.loading = true;

    const request$ = this.lease 
      ? this.leasesService.update(this.lease._id || '', this.form as any)
      : this.leasesService.create(this.form as any);

    request$.subscribe({
      next: (result) => {
        this.save.emit(result);
        this.loading = false;
        this.closeModal();
      },
      error: (err) => {
        console.error('Error saving lease:', err);
        this.loading = false;
      },
    });
  }

  closeModal(): void {
    this.close.emit();
  }

  openCreateTenant(): void {
    this.showCreateTenant = true;
    this.newTenantForm = {
      name: '',
      idNumber: '',
      phone: '',
      email: '',
    };
  }

  cancelCreateTenant(): void {
    this.showCreateTenant = false;
    this.newTenantForm = {
      name: '',
      idNumber: '',
      phone: '',
      email: '',
    };
  }

  submitNewTenant(): void {
    if (!this.newTenantForm.name || !this.newTenantForm.idNumber || !this.newTenantForm.phone) {
      console.warn('Please fill in all required fields');
      return;
    }

    this.newTenantLoading = true;

    this.propertyTenantsService.create(this.newTenantForm).subscribe({
      next: (newTenant) => {
        // Add new tenant to list and select it
        this.tenants.push(newTenant);
        this.filteredTenants = this.tenants;
        this.selectTenant(newTenant);
        this.showCreateTenant = false;
        this.newTenantLoading = false;
      },
      error: (err) => {
        console.error('Error creating tenant:', err);
        this.newTenantLoading = false;
      },
    });
  }
}
