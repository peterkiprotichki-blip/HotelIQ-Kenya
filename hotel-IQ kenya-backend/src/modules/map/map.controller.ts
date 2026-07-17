import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MapService } from './map.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Map')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('property/:propertyId')
  getPropertyPin(@Param('propertyId') propertyId: string) {
    return this.mapService.getPropertyPin(propertyId);
  }

  @Get('events')
  getNearbyEvents(
    @Query('propertyId') propertyId: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const radius = radiusKm ? parseFloat(radiusKm) : 50;
    return this.mapService.getNearbyEvents(propertyId, radius, from, to);
  }
}
