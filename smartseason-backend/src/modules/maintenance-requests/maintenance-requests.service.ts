import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MaintenanceRequest } from './schemas/maintenance-request.schema';
import { CreateMaintenanceRequestDto, UpdateMaintenanceRequestDto, CompleteMaintenanceRequestDto } from './dto/maintenance-request.dto';

@Injectable()
export class MaintenanceRequestsService {
  constructor(
    @InjectModel(MaintenanceRequest.name)
    private maintenanceRequestModel: Model<MaintenanceRequest>,
  ) {}

  async create(tenantId: string, propertyTenantId: string, dto: CreateMaintenanceRequestDto) {
    const request = new this.maintenanceRequestModel({
      tenantId,
      propertyTenantId,
      ...dto,
    });
    return request.save();
  }

  async getById(id: string, tenantId: string, propertyTenantId?: string) {
    const request = await this.maintenanceRequestModel.findById(id);
    if (!request) throw new NotFoundException('Maintenance request not found');
    
    if (request.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    // If propertyTenantId is provided (tenant access), verify they own the request
    if (propertyTenantId && request.propertyTenantId !== propertyTenantId) {
      throw new ForbiddenException('Access denied');
    }

    return request;
  }

  async getByTenant(tenantId: string, page = 1, limit = 20, status?: string) {
    const filter: any = { tenantId, isDeleted: { $ne: true } };
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.maintenanceRequestModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.maintenanceRequestModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getByPropertyTenant(tenantId: string, propertyTenantId: string, page = 1, limit = 20, status?: string) {
    const filter: any = { tenantId, propertyTenantId, isDeleted: { $ne: true } };
    if (status) {
      filter.status = status;
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.maintenanceRequestModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.maintenanceRequestModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async getByUnit(tenantId: string, unitId: string, page = 1, limit = 20) {
    const filter = { tenantId, unitId, isDeleted: { $ne: true } };
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.maintenanceRequestModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.maintenanceRequestModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async update(id: string, tenantId: string, dto: UpdateMaintenanceRequestDto) {
    const request = await this.getById(id, tenantId);
    Object.assign(request, dto);
    return request.save();
  }

  async complete(id: string, tenantId: string, dto: CompleteMaintenanceRequestDto) {
    const request = await this.getById(id, tenantId);
    request.status = 'resolved' as any;
    request.completedAt = new Date();
    request.completionNotes = dto.completionNotes;
    if (dto.attachments?.length) {
      request.attachments = dto.attachments;
    }
    return request.save();
  }

  async assignRequest(id: string, tenantId: string, userId: string) {
    const request = await this.getById(id, tenantId);
    request.assignedToUserId = userId;
    return request.save();
  }

  async delete(id: string, tenantId: string) {
    const request = await this.getById(id, tenantId);
    request.isDeleted = true;
    return request.save();
  }

  async getStats(tenantId: string) {
    const [pending, inProgress, resolved] = await Promise.all([
      this.maintenanceRequestModel.countDocuments({
        tenantId,
        status: 'pending',
        isDeleted: { $ne: true },
      }),
      this.maintenanceRequestModel.countDocuments({
        tenantId,
        status: 'in_progress',
        isDeleted: { $ne: true },
      }),
      this.maintenanceRequestModel.countDocuments({
        tenantId,
        status: 'resolved',
        isDeleted: { $ne: true },
      }),
    ]);

    return {
      pending,
      inProgress,
      resolved,
      total: pending + inProgress + resolved,
    };
  }
}
