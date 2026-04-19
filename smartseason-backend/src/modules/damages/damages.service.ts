import { Injectable, NotFoundException } from '@nestjs/common';
import { DamageRepository } from './repositories/damage.repository';
import { CreateDamageDto, UpdateDamageDto } from './dto/damage.dto';

@Injectable()
export class DamagesService {
  constructor(private readonly damageRepository: DamageRepository) {}

  async create(dto: CreateDamageDto, tenantId: string, reportedBy: string) {
    return this.damageRepository.create({
      ...dto,
      tenantId,
      reportedBy,
      status: 'reported',
    } as any);
  }

  async findAll(tenantId: string, page = 1, limit = 20, search?: string, status?: string, severity?: string) {
    const filter: any = { tenantId };
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { propertyName: { $regex: search, $options: 'i' } },
        { propertyTenantName: { $regex: search, $options: 'i' } },
      ];
    }
    return this.damageRepository.findPaginated({ page, limit, filter });
  }

  async findById(id: string, tenantId: string) {
    const damage = await this.damageRepository.findById(id);
    if (!damage || damage.isDeleted || damage.tenantId !== tenantId) {
      throw new NotFoundException('Damage report not found');
    }
    return damage;
  }

  async findByProperty(tenantId: string, propertyId: string) {
    return this.damageRepository.findByProperty(tenantId, propertyId);
  }

  async findByPropertyTenant(tenantId: string, propertyTenantId: string) {
    return this.damageRepository.findByPropertyTenant(tenantId, propertyTenantId);
  }

  async update(id: string, tenantId: string, dto: UpdateDamageDto) {
    await this.findById(id, tenantId);
    const updateData: any = { ...dto };
    if (dto.status === 'assessed') updateData.assessedDate = new Date();
    if (dto.status === 'repaired') updateData.repairedDate = new Date();
    const damage = await this.damageRepository.update(id, updateData);
    if (!damage) throw new NotFoundException('Damage report not found');
    return damage;
  }

  async remove(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.damageRepository.delete(id);
  }

  async getStats(tenantId: string) {
    const [total, reported, assessed, inRepair, repaired, totalCost] = await Promise.all([
      this.damageRepository.countByTenant(tenantId),
      this.damageRepository.countByStatus(tenantId, 'reported'),
      this.damageRepository.countByStatus(tenantId, 'assessed'),
      this.damageRepository.countByStatus(tenantId, 'in_repair'),
      this.damageRepository.countByStatus(tenantId, 'repaired'),
      this.damageRepository.getTotalCost(tenantId),
    ]);
    return { total, reported, assessed, inRepair, repaired, totalCost };
  }
}
