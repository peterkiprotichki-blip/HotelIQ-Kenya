import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PropertiesService } from '../../../shared/services/properties/properties.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { Property, PaginatedResponse } from '../../../shared/interfaces/models';
import { PropertyViewComponent } from '../property-view/property-view.component';
import { PropertyFormComponent } from '../property-form/property-form.component';

@Component({
  selector: 'app-properties-list',
  templateUrl: './properties-list.component.html',
  styleUrls: ['./properties-list.component.scss'],
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, PropertyViewComponent, PropertyFormComponent],
})
export class PropertiesListComponent implements OnInit {
  properties: Property[] = [];
  loading = true;
  search = '';
  statusFilter = '';
  typeFilter = '';
  page = 1;
  limit = 20;
  total = 0;
  totalPages = 0;

  // Modal state
  formModalOpen = false;
  viewModalOpen = false;
  selectedProperty: Property | null = null;
  viewProperty: Property | null = null;

  statusOptions = ['active', 'inactive', 'maintenance'];
  typeOptions = ['apartment', 'commercial', 'plot', 'house', 'land'];

  constructor(
    private propertiesService: PropertiesService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.loadProperties();
  }

  loadProperties(): void {
    this.loading = true;
    this.propertiesService.getAll(this.page, this.limit, this.search || undefined, this.statusFilter || undefined, this.typeFilter || undefined).subscribe({
      next: (res) => {
        this.properties = res.data;
        this.total = res.total;
        this.totalPages = res.totalPages;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  onSearch(): void {
    this.page = 1;
    this.loadProperties();
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadProperties();
  }

  goToPage(p: number): void {
    this.page = p;
    this.loadProperties();
  }

  openCreateModal(): void {
    this.selectedProperty = null;
    this.formModalOpen = true;
  }

  openEditModal(property: Property): void {
    this.selectedProperty = property;
    this.formModalOpen = true;
  }

  closeFormModal(): void {
    this.formModalOpen = false;
    this.selectedProperty = null;
  }

  openViewModal(property: Property): void {
    this.viewProperty = property;
    this.viewModalOpen = true;
  }

  closeViewModal(): void {
    this.viewModalOpen = false;
    this.viewProperty = null;
  }

  onViewPropertyEdit(property: Property): void {
    this.closeViewModal();
    this.openEditModal(property);
  }

  onPropertySaved(): void {
    this.closeFormModal();
    this.loadProperties();
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      inactive: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
      maintenance: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  }
}
