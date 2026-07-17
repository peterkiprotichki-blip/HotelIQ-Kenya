import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Properties')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  create(@Body() dto: CreatePropertyDto, @Req() req) {
    return this.propertiesService.create(dto, req.user.sub);
  }

  @Get('me')
  getMe(@Req() req) {
    return this.propertiesService.findByOwnerId(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.propertiesService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdatePropertyDto, @Req() req) {
    // Controller-level authorization check is also handled inside service but check here for security
    const property = await this.propertiesService.findById(id);
    if (property.ownerId !== req.user.sub && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenException('You are not authorized to update this property');
    }
    return this.propertiesService.update(id, dto, property.ownerId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    const property = await this.propertiesService.findById(id);
    if (property.ownerId !== req.user.sub && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenException('You are not authorized to delete this property');
    }
    return this.propertiesService.remove(id, property.ownerId);
  }
}
