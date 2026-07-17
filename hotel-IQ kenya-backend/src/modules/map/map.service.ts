import { Injectable } from '@nestjs/common';
import { PropertiesService } from '../properties/properties.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class MapService {
  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly eventsService: EventsService,
  ) {}

  async getPropertyPin(propertyId: string) {
    const property = await this.propertiesService.findById(propertyId);
    return {
      id: property.id,
      name: property.name,
      county: property.county,
      town: property.town,
      address: property.address,
      coordinates: {
        lat: property.latitude,
        lng: property.longitude,
      },
    };
  }

  async getNearbyEvents(propertyId: string, radiusKm = 50, from?: string, to?: string) {
    const property = await this.propertiesService.findById(propertyId);
    const near = `${property.latitude},${property.longitude}`;
    const events = await this.eventsService.findAll(near, radiusKm, from, to);

    return events.map((event) => ({
      id: event.id,
      name: event.name,
      category: event.category,
      coordinates: {
        lat: event.latitude,
        lng: event.longitude,
      },
      startDate: event.startDate,
      endDate: event.endDate,
      demandImpact: event.demandImpact,
      distanceKm: event.distanceKm,
    }));
  }
}
