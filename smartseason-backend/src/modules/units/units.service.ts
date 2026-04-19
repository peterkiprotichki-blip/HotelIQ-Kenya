import { Injectable, NotFoundException } from '@nestjs/common';
import { UnitRepository } from './repositories/unit.repository';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';

@Injectable()
export class UnitsService {
  constructor(private readonly unitRepository: UnitRepository) {}

  async create(dto: CreateUnitDto, tenantId: string) {
    return this.unitRepository.create({
      ...dto,
      tenantId,
      currentTenantId: '',
      currentLeaseId: '',
      currentPropertyTenantId: '',
    } as any);
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
    propertyId?: string,
    status?: string,
    search?: string,
    unitType?: string,
    floor?: string,
  ) {
    const filter: any = { tenantId };
    if (propertyId) filter.propertyId = propertyId;
    if (status) filter.status = status;
    if (unitType) filter.unitType = unitType;
    
    if (floor !== undefined && floor !== null && floor !== '') {
      // Floor can be stored as string or number in DB
      // Convert floor input to handle both cases
      if (floor === 'G' || floor === '0') {
        // For ground floor, match both 'G', 0, and '0'
        filter.floor = { $in: ['G', 0, '0', 'g'] };
      } else {
        // For numbered floors, match both string and numeric versions
        const floorNum = parseInt(floor, 10);
        if (!isNaN(floorNum)) {
          filter.floor = { $in: [floor, floorNum, String(floorNum)] };
        } else {
          filter.floor = floor;
        }
      }
    }
    
    if (search) {
      filter.$or = [
        { unitNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    return this.unitRepository.findPaginated({ page, limit, filter });
  }

  async findById(id: string, tenantId: string) {
    const unit = await this.unitRepository.findById(id);
    if (!unit || unit.isDeleted || unit.tenantId !== tenantId) {
      throw new NotFoundException('Unit not found');
    }
    return unit;
  }

  async findByProperty(propertyId: string, tenantId: string) {
    return this.unitRepository.findByProperty(propertyId, tenantId);
  }

  async update(id: string, tenantId: string, dto: UpdateUnitDto) {
    await this.findById(id, tenantId);
    const unit = await this.unitRepository.update(id, dto as any);
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async remove(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.unitRepository.delete(id);
  }

  async getStats(tenantId: string) {
    const [total, occupied, available] = await Promise.all([
      this.unitRepository.countByTenant(tenantId),
      this.unitRepository.countOccupied(tenantId),
      this.unitRepository.countAvailable(tenantId),
    ]);
    return { total, occupied, available };
  }

  async assignTenant(unitId: string, tenantId: string, propertyTenantId: string, leaseId: string) {
    const unit = await this.findById(unitId, tenantId);
    return this.unitRepository.update(unitId, {
      currentTenantId: propertyTenantId,
      currentLeaseId: leaseId,
      currentPropertyTenantId: propertyTenantId,
      status: 'occupied',
    } as any);
  }

  async releaseTenant(unitId: string, tenantId: string) {
    const unit = await this.findById(unitId, tenantId);
    return this.unitRepository.update(unitId, {
      currentTenantId: '',
      currentLeaseId: '',
      currentPropertyTenantId: '',
      status: 'vacant',
    } as any);
  }

  async updateStatus(unitId: string, tenantId: string, status: string) {
    const unit = await this.findById(unitId, tenantId);
    return this.unitRepository.update(unitId, { status } as any);
  }

  async findByPropertyTenant(propertyTenantId: string, tenantId: string) {
    return this.unitRepository.findByPropertyTenant(propertyTenantId, tenantId);
  }

  async findAvailableByProperty(propertyId: string, tenantId: string) {
    return this.unitRepository.findAvailable(propertyId, tenantId);
  }
}
