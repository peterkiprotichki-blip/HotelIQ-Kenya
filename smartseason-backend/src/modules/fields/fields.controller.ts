import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { FieldsService } from './fields.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AddFieldUpdateDto, CreateFieldDto, UpdateFieldDto } from './dto/field.dto';
import { FieldAiInsightDto } from './dto/field-ai.dto';
import { FieldAiService } from './field-ai.service';

@Controller('fields')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FieldsController {
  constructor(
    private readonly fieldsService: FieldsService,
    private readonly fieldAiService: FieldAiService,
  ) {}

  @Post()
  @Roles('super_admin', 'admin', 'manager')
  create(@Body() dto: CreateFieldDto, @Req() req) {
    return this.fieldsService.create(dto, req.user.sub);
  }

  @Get()
  @Roles('super_admin', 'admin', 'manager', 'agent')
  getAll(@Req() req) {
    return this.fieldsService.findAll(req.user);
  }

  @Get('stats')
  @Roles('super_admin', 'admin', 'manager', 'agent')
  getStats(@Req() req) {
    return this.fieldsService.getStats(req.user);
  }

  @Get(':id')
  @Roles('super_admin', 'admin', 'manager', 'agent')
  getById(@Param('id') id: string, @Req() req) {
    return this.fieldsService.findById(id, req.user);
  }

  @Put(':id')
  @Roles('super_admin', 'admin', 'manager')
  update(@Param('id') id: string, @Body() dto: UpdateFieldDto, @Req() req) {
    return this.fieldsService.update(id, dto, req.user.sub);
  }

  @Post(':id/updates')
  @Roles('super_admin', 'admin', 'manager', 'agent')
  addUpdate(@Param('id') id: string, @Body() dto: AddFieldUpdateDto, @Req() req) {
    return this.fieldsService.addUpdate(id, dto, req.user);
  }

  @Post(':id/ai/insights')
  @Roles('super_admin', 'admin', 'manager', 'agent')
  getAiInsights(@Param('id') id: string, @Body() dto: FieldAiInsightDto) {
    return this.fieldAiService.generateFieldInsights(id, dto?.focus);
  }

  @Delete(':id')
  @Roles('super_admin', 'admin', 'manager')
  remove(@Param('id') id: string) {
    return this.fieldsService.remove(id);
  }
}
