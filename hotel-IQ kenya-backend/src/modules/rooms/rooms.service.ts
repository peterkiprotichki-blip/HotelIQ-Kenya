import { ConflictException, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { mapRecord } from '../../prisma/prisma-mappers';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRoomDto, ownerId: string) {
    // Verify property belongs to owner
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
    });
    if (!property || !property.isActive) {
      throw new NotFoundException('Property not found');
    }
    if (property.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this property');
    }

    // Check unique room number per property
    const existing = await this.prisma.room.findFirst({
      where: { propertyId: dto.propertyId, roomNumber: dto.roomNumber, isActive: true },
    });
    if (existing) {
      throw new ConflictException(`Room number ${dto.roomNumber} already exists in this property`);
    }

    const room = await this.prisma.room.create({
      data: {
        propertyId: dto.propertyId,
        roomNumber: dto.roomNumber,
        roomType: dto.roomType,
        basePrice: dto.basePrice,
        capacity: dto.capacity,
        amenities: dto.amenities || [],
        isActive: true,
      },
    });

    return mapRecord(room);
  }

  async findAll(propertyId: string) {
    const rooms = await this.prisma.room.findMany({
      where: { propertyId, isActive: true },
      orderBy: { roomNumber: 'asc' },
    });
    return rooms.map(mapRecord);
  }

  async findById(id: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });
    if (!room || !room.isActive) {
      throw new NotFoundException('Room not found');
    }
    return mapRecord(room);
  }

  async update(id: string, dto: UpdateRoomDto, ownerId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });
    if (!room || !room.isActive) {
      throw new NotFoundException('Room not found');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: room.propertyId },
    });
    if (property.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own the property for this room');
    }

    if (dto.roomNumber && dto.roomNumber !== room.roomNumber) {
      const existing = await this.prisma.room.findFirst({
        where: { propertyId: room.propertyId, roomNumber: dto.roomNumber, isActive: true },
      });
      if (existing) {
        throw new ConflictException(`Room number ${dto.roomNumber} already exists in this property`);
      }
    }

    const updated = await this.prisma.room.update({
      where: { id },
      data: {
        roomNumber: dto.roomNumber,
        roomType: dto.roomType,
        basePrice: dto.basePrice,
        capacity: dto.capacity,
        amenities: dto.amenities,
      },
    });

    return mapRecord(updated);
  }

  async remove(id: string, ownerId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id },
    });
    if (!room || !room.isActive) {
      throw new NotFoundException('Room not found');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: room.propertyId },
    });
    if (property.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own the property for this room');
    }

    // Check for any bookings referencing this room
    const hasBookings = await this.prisma.booking.findFirst({
      where: { roomId: id },
    });

    if (hasBookings) {
      // Soft delete by setting isActive to false
      await this.prisma.room.update({
        where: { id },
        data: { isActive: false },
      });
    } else {
      // Hard delete if there are no bookings referencing it at all
      await this.prisma.room.delete({
        where: { id },
      });
    }

    return { message: 'Room deleted successfully' };
  }
}
