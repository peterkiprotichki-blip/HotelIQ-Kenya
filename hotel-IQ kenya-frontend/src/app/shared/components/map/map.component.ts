import { Component, AfterViewInit, ElementRef, ViewChild, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

declare const L: any;

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  template: `<div #mapContainer class="w-full h-full min-h-[350px] rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-inner"></div>`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class MapComponent implements AfterViewInit, OnChanges {
  @ViewChild('mapContainer') mapContainer!: ElementRef;
  @Input() latitude = -4.0253; // Default to Mombasa
  @Input() longitude = 39.7123;
  @Input() markerLabel = 'Mombasa Ocean Breeze Lodge';
  @Input() events: any[] = [];
  @Input() isPicker = false;
  @Input() radiusKm = 50;
  @Output() coordinatesSelected = new EventEmitter<{ lat: number, lng: number }>();

  private map: any;
  private propertyMarker: any;
  private radiusCircle: any;
  private eventMarkers: any[] = [];

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.map) {
      if (changes['latitude'] || changes['longitude']) {
        this.updatePropertyMarker();
        this.updateRadiusCircle();
      }
      if (changes['events']) {
        this.updateEventMarkers();
      }
      if (changes['radiusKm']) {
        this.updateRadiusCircle();
      }
    }
  }

  private initMap() {
    if (typeof L === 'undefined') {
      console.error('Leaflet L is not defined. Make sure Leaflet CDN is loaded.');
      return;
    }

    this.map = L.map(this.mapContainer.nativeElement).setView([this.latitude, this.longitude], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.updatePropertyMarker();
    this.updateRadiusCircle();
    this.updateEventMarkers();

    if (this.isPicker) {
      this.map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        this.latitude = lat;
        this.longitude = lng;
        this.updatePropertyMarker();
        this.coordinatesSelected.emit({ lat, lng });
      });
    }
  }

  private updatePropertyMarker() {
    if (!this.map) return;

    if (this.propertyMarker) {
      this.map.removeLayer(this.propertyMarker);
    }

    const hotelIcon = L.divIcon({
      className: 'custom-hotel-pin',
      html: `<div style="background-color: #0284c7; color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 14px; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"><i class="fas fa-hotel"></i></div>`,
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    this.propertyMarker = L.marker([this.latitude, this.longitude], { icon: hotelIcon, draggable: this.isPicker })
      .addTo(this.map)
      .bindPopup(`<b>${this.markerLabel}</b><br>Property Location`);

    if (!this.isPicker) {
      this.propertyMarker.openPopup();
    }

    if (this.isPicker) {
      this.propertyMarker.on('dragend', (e: any) => {
        const position = this.propertyMarker.getLatLng();
        this.latitude = position.lat;
        this.longitude = position.lng;
        this.coordinatesSelected.emit({ lat: position.lat, lng: position.lng });
        this.updateRadiusCircle();
      });
    }

    this.map.setView([this.latitude, this.longitude], this.map.getZoom());
  }

  private updateRadiusCircle() {
    if (!this.map) return;

    if (this.radiusCircle) {
      this.map.removeLayer(this.radiusCircle);
    }

    if (!this.isPicker) {
      this.radiusCircle = L.circle([this.latitude, this.longitude], {
        color: '#0ea5e9',
        fillColor: '#0ea5e9',
        fillOpacity: 0.1,
        radius: this.radiusKm * 1000 // Convert km to meters
      }).addTo(this.map);
    }
  }

  private updateEventMarkers() {
    if (!this.map) return;

    this.eventMarkers.forEach((m) => this.map.removeLayer(m));
    this.eventMarkers = [];

    this.events.forEach((event) => {
      // Handle events whether structure has coordinates inside location, or raw
      let lat = event.latitude;
      let lng = event.longitude;

      if (event.coordinates) {
        lat = event.coordinates.lat;
        lng = event.coordinates.lng;
      }

      if (!lat || !lng) return;

      let pinColor = '#f59e0b'; // Amber for festival
      if (event.category === 'public-holiday') pinColor = '#ef4444'; // Red
      else if (event.category === 'conference') pinColor = '#3b82f6'; // Blue
      else if (event.category === 'wildlife-season') pinColor = '#10b981'; // Green
      else if (event.category === 'restaurant') pinColor = '#ec4899'; // Pink/Rose for restaurant

      const eventIcon = L.divIcon({
        className: 'custom-event-pin',
        html: `<div style="background-color: ${pinColor}; color: white; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; font-size: 10px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><i class="fas ${this.getIconForCategory(event.category)}"></i></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 13px; line-height: 1.4; min-width: 160px;">
          <b style="font-size: 14px; color: #1e293b;">${event.name}</b><br>
          <span style="color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 10px;">${event.category}</span><br>
          <b>Dates:</b> ${new Date(event.startDate).toLocaleDateString()} - ${new Date(event.endDate).toLocaleDateString()}<br>
          <b>Demand Impact:</b> <span style="color: ${this.getImpactColor(event.demandImpact)}; font-weight: bold;">${event.demandImpact.toUpperCase()}</span><br>
          ${event.distanceKm ? `<b>Distance:</b> ${event.distanceKm} km` : ''}
          ${event.category !== 'public-holiday' ? `
            <button onclick="window.dispatchEvent(new CustomEvent('bookTicket', { detail: '${event.id || event._id}' }))" 
                    style="margin-top: 8px; width: 100%; padding: 6px; background: #0891b2; color: white; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; text-align: center; font-size: 11px;">
              ${event.category === 'restaurant' ? 'Reserve Table' : 'Book Ticket'}
            </button>
          ` : ''}
        </div>
      `;

      const m = L.marker([lat, lng], { icon: eventIcon })
        .addTo(this.map)
        .bindPopup(popupContent);

      this.eventMarkers.push(m);
    });
  }

  private getIconForCategory(cat: string): string {
    switch (cat) {
      case 'public-holiday': return 'fa-calendar-day';
      case 'festival': return 'fa-mask';
      case 'sports': return 'fa-trophy';
      case 'cultural': return 'fa-users';
      case 'wildlife-season': return 'fa-hippo';
      case 'conference': return 'fa-handshake';
      case 'restaurant': return 'fa-utensils';
      default: return 'fa-star';
    }
  }

  private getImpactColor(impact: string): string {
    if (impact === 'high') return '#ef4444';
    if (impact === 'medium') return '#f59e0b';
    return '#10b981';
  }
}
