import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EventsService, KenyanEvent } from '../../shared/services/events/events.service';
import { PropertiesService } from '../../shared/services/properties/properties.service';
import { AuthService } from '../../shared/services/auth/auth.service';
import { ThemeService } from '../../shared/services/theme/theme.service';
import { MapComponent } from '../../shared/components/map/map.component';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [CommonModule, FormsModule, MapComponent],
  templateUrl: './events.component.html',
})
export class EventsComponent implements OnInit {
  events: KenyanEvent[] = [];
  loading = true;
  error = '';
  categoryFilter = '';
  radiusKm = 50;

  propertyLatitude = -4.0253; // Defaults
  propertyLongitude = 39.7123;
  propertyName = 'My Property';

  categories = [
    { value: '', label: 'All Categories' },
    { value: 'public-holiday', label: 'Public Holiday' },
    { value: 'festival', label: 'Festival' },
    { value: 'sports', label: 'Sports' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'wildlife-season', label: 'Wildlife Season' },
    { value: 'conference', label: 'Conference' },
    { value: 'restaurant', label: 'Restaurant' },
  ];

  // Event Bookings fields
  activeTab: 'feed' | 'bookings' = 'feed';
  eventBookings: any[] = [];
  loadingBookings = false;

  // Create Event fields
  openCreateEventModal = false;
  newEvent = {
    name: '',
    description: '',
    category: 'festival',
    startDate: '',
    endDate: '',
    county: 'Uasin Gishu',
    town: 'Eldoret',
    latitude: 0.5143,
    longitude: 35.2698,
    demandImpact: 'medium' as 'low' | 'medium' | 'high',
    isNational: false
  };

  constructor(
    private readonly eventsService: EventsService,
    private readonly propertiesService: PropertiesService,
    private readonly authService: AuthService,
    public readonly themeService: ThemeService,
  ) {}

  ngOnInit(): void {
    this.loadPropertyAndEvents();
  }

  get propertyId(): string {
    return this.authService.getActiveTenantId();
  }

  loadPropertyAndEvents(): void {
    if (!this.propertyId) {
      this.error = 'No active property found. Setup property coordinates first in Settings.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = '';

    // Step 1: Load Property Coordinates
    this.propertiesService.getById(this.propertyId).subscribe({
      next: (prop: any) => {
        this.propertyName = prop.name;
        this.propertyLatitude = prop.latitude;
        this.propertyLongitude = prop.longitude;

        // Auto-center new events on property location by default
        this.newEvent.latitude = prop.latitude;
        this.newEvent.longitude = prop.longitude;
        this.newEvent.town = prop.town || 'Eldoret';
        this.newEvent.county = prop.county || 'Uasin Gishu';

        // Step 2: Load Proximity Events
        this.loadEvents();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load property coordinates';
        this.loading = false;
      },
    });
  }

  loadEvents(): void {
    const near = `${this.propertyLatitude},${this.propertyLongitude}`;
    this.eventsService.getAll(near, this.radiusKm, undefined, undefined, this.categoryFilter || undefined).subscribe({
      next: (events) => {
        this.events = events;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to load events';
        this.loading = false;
      },
    });
  }

  loadEventBookings(): void {
    this.loadingBookings = true;
    this.eventsService.getAllBookings().subscribe({
      next: (res) => {
        this.eventBookings = res;
        this.loadingBookings = false;
      },
      error: (err) => {
        console.error('Failed to load event bookings', err);
        this.loadingBookings = false;
      }
    });
  }

  switchTab(tab: 'feed' | 'bookings'): void {
    this.activeTab = tab;
    if (tab === 'bookings') {
      this.loadEventBookings();
    } else {
      this.loadEvents();
    }
  }

  onFilterChange(): void {
    this.loadEvents();
  }

  onRadiusChange(): void {
    this.loadEvents();
  }

  createEvent(): void {
    if (!this.newEvent.name || !this.newEvent.startDate || !this.newEvent.endDate) {
      alert('Please fill in required fields');
      return;
    }

    this.eventsService.create(this.newEvent).subscribe({
      next: () => {
        this.openCreateEventModal = false;
        // Reset form model
        this.newEvent = {
          name: '',
          description: '',
          category: 'festival',
          startDate: '',
          endDate: '',
          county: 'Uasin Gishu',
          town: 'Eldoret',
          latitude: this.propertyLatitude,
          longitude: this.propertyLongitude,
          demandImpact: 'medium',
          isNational: false
        };
        this.loadEvents();
      },
      error: (err) => {
        alert(err?.error?.message || 'Failed to create event');
      }
    });
  }

  getImpactBadgeColor(impact: string): string {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'low': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      default: return 'bg-gray-100 text-gray-850';
    }
  }

  formatCategory(cat: string): string {
    if (!cat) return '';
    return cat.replace(/-/g, ' ');
  }
}
