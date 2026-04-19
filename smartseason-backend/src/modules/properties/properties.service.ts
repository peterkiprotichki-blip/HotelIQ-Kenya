import { Injectable, NotFoundException } from '@nestjs/common';
import { PropertyRepository } from './repositories/property.repository';
import { CreatePropertyDto, UpdatePropertyDto } from './dto/property.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly propertyRepository: PropertyRepository) {}

  private async generatePropertyCode(tenantId: string): Promise<string> {
    // Generate code like PROP-00001, PROP-00002
    const count = await this.propertyRepository.countByTenant(tenantId);
    const code = `PROP-${String(count + 1).padStart(5, '0')}`;
    return code;
  }

  async create(dto: CreatePropertyDto, tenantId: string) {
    // Auto-generate propertyCode if not provided
    const propertyCode = dto.propertyCode || await this.generatePropertyCode(tenantId);
    return this.propertyRepository.create({ 
      ...dto, 
      tenantId, 
      propertyCode,
      floors: dto.floors ?? 0 // Ensure floors is always set
    } as any);
  }

  async findAll(tenantId: string, page = 1, limit = 20, search?: string, status?: string, type?: string) {
    const filter: any = { tenantId };
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { propertyCode: { $regex: search, $options: 'i' } },
      ];
    }

    return this.propertyRepository.findPaginated({ page, limit, filter });
  }

  async findById(id: string, tenantId: string) {
    const property = await this.propertyRepository.findById(id);
    if (!property || property.isDeleted || property.tenantId !== tenantId) {
      throw new NotFoundException('Property not found');
    }
    return property;
  }

  async update(id: string, tenantId: string, dto: UpdatePropertyDto) {
    await this.findById(id, tenantId);
    const updateData = {
      ...dto,
      floors: dto.floors ?? 0 // Ensure floors is always set
    };
    const property = await this.propertyRepository.update(id, updateData as any);
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async remove(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.propertyRepository.delete(id);
  }

  async getStats(tenantId: string) {
    const [total, active, inactive, maintenance] = await Promise.all([
      this.propertyRepository.countByTenant(tenantId),
      this.propertyRepository.countByStatus(tenantId, 'active'),
      this.propertyRepository.countByStatus(tenantId, 'inactive'),
      this.propertyRepository.countByStatus(tenantId, 'maintenance'),
    ]);
    return { total, active, inactive, maintenance };
  }
}
