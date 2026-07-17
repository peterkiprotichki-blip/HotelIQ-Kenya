import { Controller, Get, Post, Body, Query, NotFoundException, UseGuards, Req, Param } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { mapRecord, mapRecords } from '../../prisma/prisma-mappers';
import { BookingsService } from '../bookings/bookings.service';
import { CreateBookingDto } from '../bookings/dto/create-booking.dto';
import { EventsService } from '../events/events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('public')
export class PublicController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bookingsService: BookingsService,
    private readonly eventsService: EventsService,
  ) {}

  @Get('properties')
  async getProperties() {
    const props = await this.prisma.property.findMany({
      where: { isActive: true },
    });
    return mapRecords(props);
  }

  @Get('rooms')
  async getRooms(@Query('propertyId') propertyId: string) {
    const rooms = await this.prisma.room.findMany({
      where: { propertyId, isActive: true },
    });
    return mapRecords(rooms);
  }

  @Get('events')
  async getEvents(
    @Query('near') near?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('category') category?: string,
  ) {
    const radius = radiusKm ? parseFloat(radiusKm) : 100;
    return this.eventsService.findAll(near, radius, undefined, undefined, category);
  }

  @Post('bookings')
  async createBooking(@Body() dto: CreateBookingDto) {
    const room = await this.prisma.room.findUnique({
      where: { id: dto.roomId },
    });
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    const prop = await this.prisma.property.findUnique({
      where: { id: room.propertyId },
    });
    const userId = prop ? prop.ownerId : '';
    return this.bookingsService.create(dto, userId);
  }

  @Get('bookings/me')
  @UseGuards(JwtAuthGuard)
  async getMyBookings(@Req() req) {
    const email = req.user.email;
    const bookings = await this.prisma.booking.findMany({
      where: { guestEmail: email },
      orderBy: { checkIn: 'desc' },
    });
    
    const bookingsWithRooms = await Promise.all(
      bookings.map(async (b) => {
        const room = await this.prisma.room.findUnique({
          where: { id: b.roomId },
        });
        const property = await this.prisma.property.findUnique({
          where: { id: b.propertyId },
        });
        return {
          ...b,
          room: room ? mapRecord(room) : null,
          property: property ? mapRecord(property) : null,
        };
      })
    );
    
    return bookingsWithRooms;
  }

  @Post('events/:id/book')
  @UseGuards(JwtAuthGuard)
  async bookEventTicket(
    @Param('id') eventId: string,
    @Req() req,
    @Body() dto: { guestPhone?: string },
  ) {
    const email = req.user.email;
    const name = req.user.name;
    
    const event = await this.prisma.kenyanEvent.findUnique({
      where: { id: eventId },
    });
    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const booking = await this.prisma.eventBooking.create({
      data: {
        eventId,
        guestName: name,
        guestEmail: email,
        guestPhone: dto.guestPhone || '',
      },
      include: {
        event: true,
      }
    });

    return mapRecord(booking);
  }

  @Get('events/bookings/me')
  @UseGuards(JwtAuthGuard)
  async getMyEventBookings(@Req() req) {
    const email = req.user.email;
    const bookings = await this.prisma.eventBooking.findMany({
      where: { guestEmail: email },
      include: {
        event: true,
      },
      orderBy: { bookedAt: 'desc' },
    });
    return mapRecords(bookings);
  }
}
