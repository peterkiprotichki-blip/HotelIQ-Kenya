import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Get()
  findAll(
    @Query('near') near?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('category') category?: string,
  ) {
    const radius = radiusKm ? parseFloat(radiusKm) : 50;
    return this.eventsService.findAll(near, radius, from, to, category);
  }

  @Get('upcoming')
  findUpcoming(@Query('propertyId') propertyId: string) {
    return this.eventsService.findUpcoming(propertyId);
  }

  @Get('bookings/all')
  async getAllEventBookings() {
    return this.eventsService.findAllBookings();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }
}
