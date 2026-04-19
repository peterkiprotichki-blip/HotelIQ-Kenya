import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { TenantRepository } from './repositories/tenant.repository';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly tenantRepository: TenantRepository) {}

  async create(dto: CreateTenantDto, ownerUserId: string) {
    const slug = dto.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

    const existing = await this.tenantRepository.findBySlug(slug);
    if (existing) {
      throw new ConflictException(`Tenant with slug "${slug}" already exists`);
    }

    return this.tenantRepository.create({
      ...dto,
      slug,
      ownerUserId,
    } as any);
  }

  async findAll() {
    return this.tenantRepository.findBy({});
  }

  async findById(id: string) {
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant || tenant.isDeleted) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findBySlug(slug: string) {
    const tenant = await this.tenantRepository.findBySlug(slug);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async findByIds(ids: string[]) {
    return this.tenantRepository.findByIds(ids);
  }

  async findByOwner(ownerUserId: string) {
    return this.tenantRepository.findByOwner(ownerUserId);
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.tenantRepository.update(id, dto as any);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async remove(id: string) {
    return this.tenantRepository.delete(id);
  }
}
