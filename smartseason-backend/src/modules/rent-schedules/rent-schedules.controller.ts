import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { RentSchedulesService } from './rent-schedules.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Rent Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rent-schedules')
export class RentSchedulesController {
  constructor(private readonly scheduleService: RentSchedulesService) {}

  @Get('by-lease/:leaseId')
  findByLease(@Req() req, @Param('leaseId') leaseId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.findByLease(tenantId, leaseId);
  }

  @Get('by-property/:propertyId')
  findByProperty(@Req() req, @Param('propertyId') propertyId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.findByProperty(tenantId, propertyId);
  }

  @Get('by-unit/:unitId')
  findByUnit(@Req() req, @Param('unitId') unitId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.findByUnit(tenantId, unitId);
  }

  @Get('overdue')
  findOverdue(@Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.findOverdue(tenantId);
  }

  @Get('balance/:leaseId')
  getLeaseBalance(@Req() req, @Param('leaseId') leaseId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.getLeaseBalance(tenantId, leaseId);
  }

  @Post(':scheduleId/apply-payment')
  applyPayment(
    @Param('scheduleId') scheduleId: string,
    @Body('paymentId') paymentId: string,
    @Body('amount') amount: number,
    @Body('paymentDate') paymentDate: string,
    @Body('paymentMethod') paymentMethod: string,
    @Req() req,
  ) {
    const tenantId = req.user?.tenantId || '';
    // Find lease by scheduleId first
    return this.scheduleService.updateScheduleStatus(scheduleId, tenantId);
  }

  @Delete(':scheduleId')
  delete(@Param('scheduleId') scheduleId: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.scheduleService.delete(scheduleId, tenantId);
  }
}
