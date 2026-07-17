import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { mapRecord } from '../../prisma/prisma-mappers';
import { CreateEventDto } from './dto/create-event.dto';

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Radius of earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEventDto) {
    const event = await this.prisma.kenyanEvent.create({
      data: {
        name: dto.name,
        description: dto.description || '',
        category: dto.category,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        county: dto.county,
        town: dto.town,
        latitude: dto.latitude,
        longitude: dto.longitude,
        regionRelevance: dto.regionRelevance || [],
        demandImpact: dto.demandImpact,
        isNational: dto.isNational ?? false,
      },
    });

    return mapRecord(event);
  }

  async findById(id: string) {
    const event = await this.prisma.kenyanEvent.findUnique({
      where: { id },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return mapRecord(event);
  }

  async findAll(
    near?: string,
    radiusKm = 50,
    from?: string,
    to?: string,
    category?: string,
  ) {
    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (from || to) {
      where.AND = [];
      if (from) {
        where.AND.push({ endDate: { gte: new Date(from) } });
      }
      if (to) {
        where.AND.push({ startDate: { lte: new Date(to) } });
      }
    }

    const events = await this.prisma.kenyanEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    const mappedEvents = events.map(mapRecord);

    if (near) {
      const [latStr, lngStr] = near.split(',');
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);

      if (!isNaN(lat) && !isNaN(lng)) {
        return mappedEvents.filter((event) => {
          // National events are always relevant, or check coordinates
          if (event.isNational) {
            return true;
          }
          const distance = calculateDistanceKm(
            lat,
            lng,
            event.latitude,
            event.longitude,
          );
          event.distanceKm = Math.round(distance * 10) / 10;
          return distance <= radiusKm;
        });
      }
    }

    return mappedEvents;
  }

  async findUpcoming(propertyId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
    });
    if (!property || !property.isActive) {
      throw new NotFoundException('Property not found');
    }

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get all events starting in next 30 days or ongoing
    const events = await this.prisma.kenyanEvent.findMany({
      where: {
        startDate: { lte: thirtyDaysFromNow },
        endDate: { gte: now },
      },
      orderBy: { startDate: 'asc' },
    });

    const mappedEvents = events.map(mapRecord);

    // Filter by proximity or national relevancy
    return mappedEvents.filter((event) => {
      if (event.isNational) {
        return true;
      }
      const distance = calculateDistanceKm(
        property.latitude,
        property.longitude,
        event.latitude,
        event.longitude,
      );
      event.distanceKm = Math.round(distance * 10) / 10;
      return distance <= 50; // within 50km
    });
  }

  async findAllBookings() {
    const bookings = await this.prisma.eventBooking.findMany({
      include: {
        event: true,
      },
      orderBy: { bookedAt: 'desc' },
    });
    return bookings.map(mapRecord);
  }
}
