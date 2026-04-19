import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request as NestRequest } from '@nestjs/common';
import { MaintenanceRequestsService } from './maintenance-requests.service';
import { CreateMaintenanceRequestDto, UpdateMaintenanceRequestDto, CompleteMaintenanceRequestDto } from './dto/maintenance-request.dto';

@Controller('maintenance-requests')
export class MaintenanceRequestsController {
  constructor(private maintenanceRequestsService: MaintenanceRequestsService) {}

  @Post()
  async create(@NestRequest() req, @Body() dto: CreateMaintenanceRequestDto) {
    return this.maintenanceRequestsService.create(
      req.user.tenantId,
      req.user.role === 'tenant' ? req.user.propertyTenantId : undefined,
      dto,
    );
  }

  @Get()
  async getAll(@NestRequest() req, @Query('page') page = 1, @Query('limit') limit = 20, @Query('status') status?: string) {
    // Tenants see only their own requests
    if (req.user.role === 'tenant') {
      return this.maintenanceRequestsService.getByPropertyTenant(req.user.tenantId, req.user.propertyTenantId, page, limit, status);
    }
    // Managers/Admins see all requests for their org
    return this.maintenanceRequestsService.getByTenant(req.user.tenantId, page, limit, status);
  }

  @Get('unit/:unitId')
  async getByUnit(@NestRequest() req, @Param('unitId') unitId: string, @Query('page') page = 1, @Query('limit') limit = 20) {
    return this.maintenanceRequestsService.getByUnit(req.user.tenantId, unitId, page, limit);
  }

  @Get(':id')
  async getById(@NestRequest() req, @Param('id') id: string) {
    const propertyTenantId = req.user.role === 'tenant' ? req.user.propertyTenantId : undefined;
    return this.maintenanceRequestsService.getById(id, req.user.tenantId, propertyTenantId);
  }

  @Put(':id')
  async update(@NestRequest() req, @Param('id') id: string, @Body() dto: UpdateMaintenanceRequestDto) {
    return this.maintenanceRequestsService.update(id, req.user.tenantId, dto);
  }

  @Post(':id/complete')
  async complete(@NestRequest() req, @Param('id') id: string, @Body() dto: CompleteMaintenanceRequestDto) {
    return this.maintenanceRequestsService.complete(id, req.user.tenantId, dto);
  }

  @Post(':id/assign/:userId')
  async assign(@NestRequest() req, @Param('id') id: string, @Param('userId') userId: string) {
    return this.maintenanceRequestsService.assignRequest(id, req.user.tenantId, userId);
  }

  @Delete(':id')
  async delete(@NestRequest() req, @Param('id') id: string) {
    return this.maintenanceRequestsService.delete(id, req.user.tenantId);
  }

  @Get('stats/overview')
  async getStats(@NestRequest() req) {
    return this.maintenanceRequestsService.getStats(req.user.tenantId);
  }
}
