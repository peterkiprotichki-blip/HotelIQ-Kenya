import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { PropertiesService } from '../../shared/services/properties/properties.service';
import { NotificationService } from '../../shared/services/notification.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
  presetColors = [
    '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
  ];

  propertyName = '';
  propertyCounty = 'Mombasa';
  propertyTown = 'Mombasa';
  propertyAddress = '';
  propertyContactPhone = '';
  propertyContactEmail = '';
  propertyLatitude = -4.0253; // Mombasa Default
  propertyLongitude = 39.7123;

  loadingProperty = false;
  savingProperty = false;
  propertySaved = false;
  propertyError = '';

  constructor(
    public readonly themeService: ThemeService,
    public readonly authService: AuthService,
    private readonly propertiesService: PropertiesService,
    private readonly notificationService: NotificationService,
  ) {}

  ngOnInit() {
    this.loadProperty();
  }

  get user() { return this.authService.getUser(); }

  get activeTenant() {
    const activeTenantId = this.authService.getActiveTenantId();
    return this.authService.getTenants().find((tenant: { _id: string }) => tenant._id === activeTenantId) || null;
  }

  loadProperty(): void {
    if (!this.activeTenant) return;
    this.loadingProperty = true;
    this.propertyError = '';

    this.propertiesService.getById(this.activeTenant._id).subscribe({
      next: (prop: any) => {
        this.propertyName = prop.name || '';
        this.propertyCounty = prop.county || 'Mombasa';
        this.propertyTown = prop.town || 'Mombasa';
        this.propertyAddress = prop.address || '';
        this.propertyContactPhone = prop.contactPhone || '';
        this.propertyContactEmail = prop.contactEmail || '';
        this.propertyLatitude = prop.latitude || -4.0253;
        this.propertyLongitude = prop.longitude || 39.7123;
        this.loadingProperty = false;
      },
      error: (err) => {
        this.propertyError = err?.error?.message || 'Failed to load property details';
        this.loadingProperty = false;
      }
    });
  }

  onCoordinatesSelected(coords: { lat: number, lng: number }): void {
    this.propertyLatitude = coords.lat;
    this.propertyLongitude = coords.lng;
  }

  savePropertySettings(): void {
    if (!this.activeTenant) return;
    this.savingProperty = true;
    this.propertyError = '';
    this.propertySaved = false;

    const payload = {
      name: this.propertyName,
      county: this.propertyCounty,
      town: this.propertyTown,
      address: this.propertyAddress,
      contactPhone: this.propertyContactPhone,
      contactEmail: this.propertyContactEmail,
      latitude: Number(this.propertyLatitude),
      longitude: Number(this.propertyLongitude),
    };

    this.propertiesService.update(this.activeTenant._id, payload).subscribe({
      next: () => {
        this.savingProperty = false;
        this.propertySaved = true;
        this.notificationService.success('Lodge settings updated successfully!');
        
        // Update local memory activeTenant name
        const tenant = this.activeTenant as any;
        if (tenant) tenant.name = this.propertyName;
        
        setTimeout(() => (this.propertySaved = false), 3000);
      },
      error: (err) => {
        this.savingProperty = false;
        this.propertyError = err?.error?.message || 'Failed to save lodge settings';
        this.notificationService.error(this.propertyError);
      }
    });
  }

  toggleDarkMode(): void { this.themeService.toggleTheme(); }

  setAccentColor(color: string): void { this.themeService.setAccentColor(color); }
}
