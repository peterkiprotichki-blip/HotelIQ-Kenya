import { ConflictException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { mapRecord } from '../../prisma/prisma-mappers';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePropertyDto, ownerId: string) {
    // Enforce coordinates aren't {0,0}
    if (dto.coordinates.lat === 0 && dto.coordinates.lng === 0) {
      throw new BadRequestException('Coordinates cannot be placeholder {0,0}');
    }

    // Enforce one active property per owner for MVP
    const existing = await this.prisma.property.findFirst({
      where: { ownerId, isActive: true },
    });
    if (existing) {
      throw new ConflictException('Owner already has an active property. MVP supports only one property.');
    }

    const property = await this.prisma.property.create({
      data: {
        name: dto.name,
        county: dto.county,
        town: dto.town,
        address: dto.address,
        latitude: dto.coordinates.lat,
        longitude: dto.coordinates.lng,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail || '',
        ownerId,
        isActive: true,
      },
    });

    return mapRecord(property);
  }

  async findByOwnerId(ownerId: string) {
    const property = await this.prisma.property.findFirst({
      where: { ownerId, isActive: true },
    });
    if (!property) {
      throw new NotFoundException('No active property found for this user');
    }
    return mapRecord(property);
  }

  async findById(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });
    if (!property || !property.isActive) {
      throw new NotFoundException('Property not found');
    }
    return mapRecord(property);
  }

  async update(id: string, dto: UpdatePropertyDto, ownerId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });
    if (!property || !property.isActive) {
      throw new NotFoundException('Property not found');
    }

    if (property.ownerId !== ownerId) {
      throw new ConflictException('You are not authorized to update this property');
    }

    if (dto.coordinates) {
      if (dto.coordinates.lat === 0 && dto.coordinates.lng === 0) {
        throw new BadRequestException('Coordinates cannot be placeholder {0,0}');
      }
    }

    const updated = await this.prisma.property.update({
      where: { id },
      data: {
        name: dto.name,
        county: dto.county,
        town: dto.town,
        address: dto.address,
        latitude: dto.coordinates?.lat,
        longitude: dto.coordinates?.lng,
        contactPhone: dto.contactPhone,
        contactEmail: dto.contactEmail,
      },
    });

    return mapRecord(updated);
  }

  async remove(id: string, ownerId: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });
    if (!property || !property.isActive) {
      throw new NotFoundException('Property not found');
    }

    if (property.ownerId !== ownerId) {
      throw new ConflictException('You are not authorized to delete this property');
    }

    await this.prisma.property.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: 'Property soft-deleted successfully' };
  }
}
