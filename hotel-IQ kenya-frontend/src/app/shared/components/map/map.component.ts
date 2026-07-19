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
  @Input() latitude = -4.0253;
  @Input() longitude = 39.7123;
  @Input() markerLabel = 'Mombasa Ocean Breeze Lodge';
  @Input() events: any[] = [];
  @Input() properties: any[] = [];
  @Input() selectedPropertyId: string | null = null;
  @Input() isPicker = false;
  @Input() radiusKm = 50;
  @Input() userLat: number | null = null;
  @Input() userLng: number | null = null;
  @Output() coordinatesSelected = new EventEmitter<{ lat: number, lng: number }>();
  @Output() locationReady = new EventEmitter<{ lat: number; lng: number }>();

  private map: any;
  private propertyMarker: any;
  private propertyMarkers: any[] = [];
  private radiusCircle: any;
  private eventMarkers: any[] = [];
  private userMarker: any;
  private userPulse: any;

  ngAfterViewInit() {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.map) {
      if (changes['latitude'] || changes['longitude']) {
        this.updatePropertyMarker();
        this.updateRadiusCircle();
        this.fitBoundsToProperties();
      }
      if (changes['events']) {
        this.updateEventMarkers();
      }
      if (changes['properties'] || changes['selectedPropertyId']) {
        this.updateAllPropertyMarkers();
      }
      if (changes['radiusKm']) {
        this.updateRadiusCircle();
      }
      if (changes['userLat'] || changes['userLng']) {
        this.updateUserMarker();
      }
    }
  }

  private initMap() {
    if (typeof L === 'undefined') {
      console.error('Leaflet L is not defined.');
      return;
    }

    this.map = L.map(this.mapContainer.nativeElement).setView([this.latitude, this.longitude], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.updatePropertyMarker();
    this.updateRadiusCircle();
    this.updateEventMarkers();
    this.updateAllPropertyMarkers();
    this.updateUserMarker();
    this.fitBoundsToProperties();
    this.requestUserLocation();

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

  private requestUserLocation(): void {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.userLat = pos.coords.latitude;
        this.userLng = pos.coords.longitude;
        this.updateUserMarker();
        this.locationReady.emit({ lat: this.userLat, lng: this.userLng });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }

  private updateUserMarker(): void {
    if (!this.map) return;

    if (this.userMarker) this.map.removeLayer(this.userMarker);
    if (this.userPulse) this.map.removeLayer(this.userPulse);

    if (this.userLat == null || this.userLng == null) return;

    const pulseIcon = L.divIcon({
      className: 'user-pulse',
      html: `<div style="background-color: rgba(59,130,246,0.3); width: 32px; height: 32px; border-radius: 50%; animation: userPulse 2s infinite;"></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const userIcon = L.divIcon({
      className: 'user-location-pin',
      html: `<div style="background-color: #3b82f6; color: white; border-radius: 50%; width: 16px; height: 16px; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35);"><i class="fas fa-circle" style="font-size:6px;display:none;"></i></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    this.userPulse = L.marker([this.userLat, this.userLng], { icon: pulseIcon, zIndexOffset: 900, interactive: false }).addTo(this.map);
    this.userMarker = L.marker([this.userLat, this.userLng], { icon: userIcon, zIndexOffset: 901 })
      .addTo(this.map)
      .bindPopup('<b>Your Location</b>');

    if (!this.styleEl) {
      this.styleEl = document.createElement('style');
      this.styleEl.textContent = '@keyframes userPulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(3); opacity: 0; } }';
      document.head.appendChild(this.styleEl);
    }
  }

  private styleEl: HTMLStyleElement | null = null;

  private updateAllPropertyMarkers() {
    if (!this.map) return;

    this.propertyMarkers.forEach((m) => this.map.removeLayer(m));
    this.propertyMarkers = [];

    if (!this.properties || !this.properties.length) return;

    const selectedId = this.selectedPropertyId;

    const lodgeColors = ['#0284c7', '#7c3aed', '#059669', '#d97706'];
    let colorIndex = 0;

    for (const prop of this.properties) {
      if (!prop.latitude || !prop.longitude) continue;

      const isSelected = selectedId && (prop.id === selectedId || prop._id === selectedId);

      const bgColor = isSelected ? lodgeColors[colorIndex % lodgeColors.length] : lodgeColors[colorIndex % lodgeColors.length];
      const size = isSelected ? 44 : 32;
      const borderWidth = isSelected ? 4 : 2;
      const zIndex = isSelected ? 1000 : 500;
      const pulse = isSelected ? 'animation: pulse 1.5s infinite;' : '';
      const opacity = isSelected ? 1 : 0.8;
      colorIndex++;

      const markerIcon = L.divIcon({
        className: 'custom-lodge-pin',
        html: `<div style="background-color: ${bgColor}; color: white; border-radius: 50%; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; font-size: ${isSelected ? 16 : 12}px; border: ${borderWidth}px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.35); ${pulse} opacity: ${opacity};"><i class="fas fa-hotel"></i></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const distStr = this.userLat != null && this.userLng != null
        ? `<span style="font-size: 11px; color: #6366f1; font-weight: 600;">${Math.round(this.haversineKm(this.userLat, this.userLng, prop.latitude, prop.longitude))} km from you</span><br>`
        : '';

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.45; min-width: 150px;">
          <b style="font-size: 14px; color: #1e293b;">${prop.name}</b><br>
          <span style="color: #64748b;">${prop.town}, ${prop.county}</span><br>
          <span style="color: #64748b; font-size: 11px;">${prop.address || ''}</span><br>
          ${distStr}
          ${prop.contactPhone ? `<span style="font-size: 11px;">Phone: ${prop.contactPhone}</span><br>` : ''}
          ${!isSelected ? `<a href="javascript:void(0)" onclick="window.dispatchEvent(new CustomEvent('selectProperty', { detail: '${prop.id || prop._id}' }))" style="display: inline-block; margin-top: 6px; padding: 5px 10px; background: #0891b2; color: white; border-radius: 6px; font-weight: bold; text-decoration: none; font-size: 11px;">Select Lodge</a>` : `<span style="display: inline-block; margin-top: 6px; padding: 5px 10px; background: #0284c7; color: white; border-radius: 6px; font-weight: bold; font-size: 11px;">Selected</span>`}
        </div>
      `;

      const marker = L.marker([prop.latitude, prop.longitude], { icon: markerIcon, zIndexOffset: zIndex })
        .addTo(this.map)
        .bindPopup(popupContent);

      if (isSelected) {
        marker.openPopup();
      }

      this.propertyMarkers.push(marker);
    }
  }

  private fitBoundsToProperties() {
    if (!this.map || !this.properties || !this.properties.length) return;

    const markers = this.propertyMarkers.filter((m) => {
      const latlng = m.getLatLng();
      return latlng && isFinite(latlng.lat) && isFinite(latlng.lng);
    });

    if (markers.length === 0) return;

    if (markers.length === 1) {
      this.map.setView(markers[0].getLatLng(), 12);
      return;
    }

    const group = L.featureGroup(markers);
    this.map.fitBounds(group.getBounds(), { padding: [40, 40] });
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
        radius: this.radiusKm * 1000
      }).addTo(this.map);
    }
  }

  private updateEventMarkers() {
    if (!this.map) return;

    this.eventMarkers.forEach((m) => this.map.removeLayer(m));
    this.eventMarkers = [];

    this.events.forEach((event) => {
      let lat = event.latitude;
      let lng = event.longitude;

      if (event.coordinates) {
        lat = event.coordinates.lat;
        lng = event.coordinates.lng;
      }

      if (!lat || !lng) return;

      let pinColor = '#ef4444';

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
          ${this.userLat != null && this.userLng != null ? `<b>Distance:</b> ${Math.round(this.haversineKm(this.userLat, this.userLng, lat, lng))} km from you<br>` : ''}
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

  private haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
