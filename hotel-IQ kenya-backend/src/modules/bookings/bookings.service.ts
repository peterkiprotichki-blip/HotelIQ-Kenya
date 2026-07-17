import { ConflictException, Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { mapRecord } from '../../prisma/prisma-mappers';
import { CreateBookingDto } from './dto/create-booking.dto';
import { EventEmitter } from 'events';

export const bookingEvents = new EventEmitter();

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookingDto, ownerId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
    });
    if (!room || !room.isActive) {
      throw new NotFoundException('Room not found');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: room.propertyId },
    });
    if (!property || property.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own the property for this room');
    }

    const checkInDate = new Date(dto.checkIn);
    const checkOutDate = new Date(dto.checkOut);

    if (checkInDate >= checkOutDate) {
      throw new BadRequestException('Check-out date must be after check-in date');
    }

    // Run Conflict Check
    await this.checkConflict(dto.roomId, checkInDate, checkOutDate);

    // Get Price Snapshot
    const checkInDateOnly = new Date(checkInDate);
    checkInDateOnly.setHours(0, 0, 0, 0);

    const activeSuggestion = await this.prisma.pricingSuggestion.findFirst({
      where: {
        propertyId: room.propertyId,
        roomType: room.roomType,
        date: {
          gte: checkInDateOnly,
          lt: new Date(checkInDateOnly.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    const pricePerNight = activeSuggestion ? activeSuggestion.suggestedPrice : room.basePrice;
    
    // Calculate nights
    const diffMs = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    const totalPrice = pricePerNight * nights;

    const booking = await this.prisma.booking.create({
      data: {
        propertyId: room.propertyId,
        roomId: dto.roomId,
        guestName: dto.guestName,
        guestPhone: dto.guestPhone,
        guestEmail: dto.guestEmail || '',
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: 'confirmed',
        pricePerNight,
        totalPrice,
        source: dto.source || 'direct',
      },
    });

    // Emit lightweight event
    bookingEvents.emit('bookingCreated', booking);

    return mapRecord(booking);
  }

  async checkConflict(roomId: string, checkIn: Date, checkOut: Date, excludeBookingId?: string) {
    const conflict = await this.prisma.booking.findFirst({
      where: {
        roomId,
        status: { notIn: ['cancelled', 'no_show'] },
        id: excludeBookingId ? { not: excludeBookingId } : undefined,
        OR: [
          {
            checkIn: { lt: checkOut },
            checkOut: { gt: checkIn },
          },
        ],
      },
    });

    if (conflict) {
      throw new ConflictException(
        `Room is already booked from ${conflict.checkIn.toISOString().split('T')[0]} to ${conflict.checkOut.toISOString().split('T')[0]}`
      );
    }
  }

  async findAll(propertyId: string, from?: string, to?: string, status?: string) {
    const where: any = { propertyId };

    if (status) {
      where.status = status;
    }

    if (from || to) {
      where.AND = [];
      if (from) {
        where.AND.push({ checkOut: { gte: new Date(from) } });
      }
      if (to) {
        where.AND.push({ checkIn: { lte: new Date(to) } });
      }
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      orderBy: { checkIn: 'asc' },
    });

    // Enrich with room details
    const enrichedBookings = [];
    for (const b of bookings) {
      const room = await this.prisma.room.findUnique({ where: { id: b.roomId } });
      enrichedBookings.push({
        ...mapRecord(b),
        roomNumber: room?.roomNumber || 'Unknown',
        roomType: room?.roomType || 'Unknown',
      });
    }

    return enrichedBookings;
  }

  async findById(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const room = await this.prisma.room.findUnique({ where: { id: booking.roomId } });
    return {
      ...mapRecord(booking),
      roomNumber: room?.roomNumber || 'Unknown',
      roomType: room?.roomType || 'Unknown',
    };
  }

  async update(id: string, dto: any, ownerId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: booking.propertyId },
    });
    if (property.ownerId !== ownerId) {
      throw new ConflictException('You do not own the property for this booking');
    }

    const updatedData: any = {};
    let checkIn = booking.checkIn;
    let checkOut = booking.checkOut;
    let roomId = booking.roomId;

    if (dto.roomId) {
      roomId = dto.roomId;
      updatedData.roomId = dto.roomId;
    }
    if (dto.checkIn) {
      checkIn = new Date(dto.checkIn);
      updatedData.checkIn = checkIn;
    }
    if (dto.checkOut) {
      checkOut = new Date(dto.checkOut);
      updatedData.checkOut = checkOut;
    }
    if (dto.guestName) updatedData.guestName = dto.guestName;
    if (dto.guestPhone) updatedData.guestPhone = dto.guestPhone;
    if (dto.guestEmail !== undefined) updatedData.guestEmail = dto.guestEmail;
    if (dto.source) updatedData.source = dto.source;

    // Re-run conflict check if dates or room changed
    if (dto.roomId || dto.checkIn || dto.checkOut) {
      if (checkIn >= checkOut) {
        throw new BadRequestException('Check-out date must be after check-in date');
      }
      await this.checkConflict(roomId, checkIn, checkOut, id);

      // Recompute price snapshot since dates/room changed
      const room = await this.prisma.room.findUnique({ where: { id: roomId } });
      if (!room) {
        throw new NotFoundException('Room not found');
      }

      const checkInDateOnly = new Date(checkIn);
      checkInDateOnly.setHours(0, 0, 0, 0);

      const activeSuggestion = await this.prisma.pricingSuggestion.findFirst({
        where: {
          propertyId: room.propertyId,
          roomType: room.roomType,
          date: {
            gte: checkInDateOnly,
            lt: new Date(checkInDateOnly.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      const pricePerNight = activeSuggestion ? activeSuggestion.suggestedPrice : room.basePrice;
      const diffMs = checkOut.getTime() - checkIn.getTime();
      const nights = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      
      updatedData.pricePerNight = pricePerNight;
      updatedData.totalPrice = pricePerNight * nights;
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: updatedData,
    });

    return mapRecord(updated);
  }

  async transitionStatus(id: string, targetStatus: string, ownerId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: booking.propertyId },
    });
    if (property.ownerId !== ownerId) {
      throw new ConflictException('You do not own the property for this booking');
    }

    // State machine transitions
    const validTransitions: Record<string, string[]> = {
      confirmed: ['checked-in', 'cancelled', 'no-show'],
      'checked-in': ['checked-out'],
      'checked-out': [],
      cancelled: [],
      'no-show': [],
    };

    const currentStatus = booking.status;
    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Invalid status transition from "${currentStatus}" to "${targetStatus}"`
      );
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: targetStatus },
    });

    return mapRecord(updated);
  }

  async remove(id: string, ownerId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
    });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const property = await this.prisma.property.findUnique({
      where: { id: booking.propertyId },
    });
    if (property.ownerId !== ownerId) {
      throw new ConflictException('You do not own the property for this booking');
    }

    // Only allowed if status is cancelled
    if (booking.status !== 'cancelled') {
      throw new BadRequestException('Only cancelled bookings can be deleted');
    }

    await this.prisma.booking.delete({
      where: { id },
    });

    return { message: 'Booking deleted successfully' };
  }
}

