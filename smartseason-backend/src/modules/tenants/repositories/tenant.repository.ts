import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { Tenant } from '../schemas/tenant.schema';

@Injectable()
export class TenantRepository extends BaseRepository<Tenant> {
  constructor(@InjectModel(Tenant.name) model: Model<Tenant>) {
    super(model);
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.model.findOne({ slug, isDeleted: false }).exec();
  }

  async findByOwner(ownerUserId: string): Promise<Tenant[]> {
    return this.model.find({ ownerUserId, isDeleted: false }).sort({ createdAt: -1 }).exec();
  }

  async findByIds(ids: string[]): Promise<Tenant[]> {
    return this.model.find({ _id: { $in: ids }, isDeleted: false, isActive: true }).exec();
  }
}
