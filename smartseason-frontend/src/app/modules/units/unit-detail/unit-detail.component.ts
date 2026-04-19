import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { UnitsService, Unit } from '../../../shared/services/units/units.service';
import { PropertiesService } from '../../../shared/services/properties/properties.service';
import { PropertyTenantsService } from '../../../shared/services/property-tenants/property-tenants.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { Property } from '../../../shared/interfaces/models';
import { UnitsFormComponent } from '../units-form/units-form.component';

@Component({
  selector: 'app-unit-detail',
  templateUrl: './unit-detail.component.html',
  styleUrls: ['./unit-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, UnitsFormComponent],
})
export class UnitDetailComponent implements OnInit {
  unit: Unit | null = null;
  property: Property | null = null;
  loading = true;
  formModalOpen = false;

  statusOptions = ['vacant', 'occupied', 'maintenance', 'reserved'];

  constructor(
    private unitsService: UnitsService,
    private propertiesService: PropertiesService,
    private propertyTenantsService: PropertyTenantsService,
    public themeService: ThemeService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadUnit(id);
    }
  }

  loadUnit(id: string): void {
    this.loading = true;
    this.unitsService.getById(id).subscribe({
      next: (unit) => {
        this.unit = unit;
        if (unit.propertyId) {
          this.loadProperty(unit.propertyId);
        } else {
          this.loading = false;
        }
        // Load tenant name if assigned
        if (unit.currentTenantId) {
          this.propertyTenantsService.getById(unit.currentTenantId).subscribe({
            next: (tenant) => {
              if (this.unit) {
                this.unit.currentTenantName = tenant.name;
              }
            },
            error: (err) => console.error('Load tenant error:', err),
          });
        }
      },
      error: (err) => {
        console.error('Load error:', err);
        this.loading = false;
      },
    });
  }

  loadProperty(propertyId: string): void {
    this.propertiesService.getById(propertyId).subscribe({
      next: (property) => {
        this.property = property;
        if (this.unit) {
          this.unit.propertyName = property.name;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Load property error:', err);
        this.loading = false;
      },
    });
  }

  openEditModal(): void {
    this.formModalOpen = true;
  }

  closeFormModal(): void {
    this.formModalOpen = false;
  }

  onUnitSaved(unit: Unit): void {
    this.unit = unit;
    this.closeFormModal();
  }

  deleteUnit(): void {
    if (!this.unit?._id) return;
    if (confirm('Are you sure you want to delete this unit?')) {
      this.unitsService.delete(this.unit._id).subscribe({
        next: () => {
          this.router.navigate(['/units']);
        },
        error: (err) => {
          console.error('Delete error:', err);
        },
      });
    }
  }

  getStatusClass(status: string | undefined): string {
    const map: Record<string, string> = {
      vacant: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      occupied: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      maintenance: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      reserved: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    };
    return status ? (map[status] || 'bg-gray-100 text-gray-700') : 'bg-gray-100 text-gray-700';
  }
}
