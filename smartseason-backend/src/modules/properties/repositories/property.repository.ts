import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { Property } from '../schemas/property.schema';

@Injectable()
export class PropertyRepository extends BaseRepository<Property> {
  constructor(@InjectModel(Property.name) model: Model<Property>) {
    super(model);
  }

  async findByTenant(tenantId: string): Promise<Property[]> {
    return this.model.find({ tenantId, isDeleted: false }).sort({ createdAt: -1 }).exec();
  }

  async findByStatus(tenantId: string, status: string): Promise<Property[]> {
    return this.model.find({ tenantId, status, isDeleted: false }).sort({ createdAt: -1 }).exec();
  }

  async findByManager(tenantId: string, managerId: string): Promise<Property[]> {
    return this.model.find({ tenantId, managerId, isDeleted: false }).sort({ createdAt: -1 }).exec();
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.model.countDocuments({ tenantId, isDeleted: false });
  }

  async countByStatus(tenantId: string, status: string): Promise<number> {
    return this.model.countDocuments({ tenantId, status, isDeleted: false });
  }
}
