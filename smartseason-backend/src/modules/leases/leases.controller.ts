import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { LeasesService } from './leases.service';
import { CreateLeaseDto, UpdateLeaseDto } from './dto/lease.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Leases')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('leases')
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Post()
  create(@Body() dto: CreateLeaseDto, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.leasesService.create(dto, tenantId);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const tenantId = req.user?.tenantId || '';
    return this.leasesService.findAll(tenantId, page, limit, search, status);
  }

  @Get('stats')
  getStats(@Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.leasesService.getStats(tenantId);
  }

  @Get('expiring-soon')
  getExpiringSoon(@Req() req, @Query('days') days?: number) {
    const tenantId = req.user?.tenantId || '';
    return this.leasesService.findExpiringSoon(tenantId, days);
  }

  @Get('by-property/:propertyId')
  findByProperty(@Req() req, @Param('propertyId') propertyId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.leasesService.findByProperty(tenantId, propertyId);
  }

  @Get('by-tenant/:propertyTenantId')
  findByPropertyTenant(@Req() req, @Param('propertyTenantId') propertyTenantId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.leasesService.findByPropertyTenant(tenantId, propertyTenantId);
  }

  @Get('by-unit/:unitId')
  findByUnit(@Req() req, @Param('unitId') unitId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.leasesService.findByUnit(tenantId, unitId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.leasesService.findById(id, tenantId);
  }

  @Get(':id/details-with-balance')
  async findWithBalance(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.leasesService.findWithBalance(id, tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeaseDto, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.leasesService.update(id, tenantId, dto);
  }

  @Put(':id/activate')
  activate(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.leasesService.activate(id, tenantId);
  }

  @Put(':id/terminate')
  terminate(@Param('id') id: string, @Body('reason') reason: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.leasesService.terminate(id, tenantId, reason);
  }

  @Put(':id/sign')
  sign(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    const propertyTenantId = req.user?.propertyTenantId || '';
    return this.leasesService.signLease(id, propertyTenantId, tenantId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.leasesService.remove(id, tenantId);
  }
}
