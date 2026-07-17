import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('occupancy')
  getOccupancy(
    @Query('propertyId') propertyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.dashboardService.getOccupancy(propertyId, from, to);
  }

  @Get('revenue')
  getRevenue(
    @Query('propertyId') propertyId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.dashboardService.getRevenue(propertyId, from, to);
  }

  @Get('upcoming')
  getUpcoming(@Query('propertyId') propertyId: string) {
    return this.dashboardService.getUpcoming(propertyId);
  }

  @Get('summary')
  getSummary(@Query('propertyId') propertyId: string) {
    return this.dashboardService.getSummary(propertyId);
  }
}
