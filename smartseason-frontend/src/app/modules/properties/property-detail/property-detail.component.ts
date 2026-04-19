import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PropertiesService } from '../../../shared/services/properties/properties.service';
import { ThemeService } from '../../../shared/services/theme/theme.service';
import { Property } from '../../../shared/interfaces/models';
import { PropertyFormComponent } from '../property-form/property-form.component';

@Component({
  selector: 'app-property-detail',
  templateUrl: './property-detail.component.html',
  styleUrls: ['./property-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, PropertyFormComponent],
})
export class PropertyDetailComponent implements OnInit {
  property: Property | null = null;
  loading = true;
  deleting = false;
  showEditForm = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertiesService: PropertiesService,
    public themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.propertiesService.getById(id).subscribe({
        next: (prop) => { this.property = prop; this.loading = false; },
        error: () => { this.loading = false; this.router.navigate(['/properties']); },
      });
    }
  }

  openEditModal(): void {
    this.showEditForm = true;
  }

  onPropertyUpdated(updatedProperty: Property): void {
    this.property = updatedProperty;
    this.showEditForm = false;
  }

  deleteProperty(): void {
    if (!this.property || !confirm('Are you sure you want to delete this property?')) return;
    this.deleting = true;
    this.propertiesService.delete(this.property._id).subscribe({
      next: () => this.router.navigate(['/properties']),
      error: () => { this.deleting = false; },
    });
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
