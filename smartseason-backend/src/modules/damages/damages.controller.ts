import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { DamagesService } from './damages.service';
import { CreateDamageDto, UpdateDamageDto } from './dto/damage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Damages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('damages')
export class DamagesController {
  constructor(private readonly damagesService: DamagesService) {}

  @Post()
  create(@Body() dto: CreateDamageDto, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    const reportedBy = req.user?.userId || '';
    return this.damagesService.create(dto, tenantId, reportedBy);
  }

  @Get()
  findAll(
    @Req() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('severity') severity?: string,
  ) {
    const tenantId = req.user?.tenantId || '';
    return this.damagesService.findAll(tenantId, page, limit, search, status, severity);
  }

  @Get('stats')
  getStats(@Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.damagesService.getStats(tenantId);
  }

  @Get('by-property/:propertyId')
  findByProperty(@Req() req, @Param('propertyId') propertyId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.damagesService.findByProperty(tenantId, propertyId);
  }

  @Get('by-tenant/:propertyTenantId')
  findByPropertyTenant(@Req() req, @Param('propertyTenantId') propertyTenantId: string) {
    const tenantId = req.user?.tenantId || '';
    return this.damagesService.findByPropertyTenant(tenantId, propertyTenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.damagesService.findById(id, tenantId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDamageDto, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.damagesService.update(id, tenantId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req) {
    const tenantId = req.user?.tenantId || '';
    return this.damagesService.remove(id, tenantId);
  }
}
