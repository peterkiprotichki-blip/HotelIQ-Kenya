import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { mapRecord, mapRecords } from '../../prisma/prisma-mappers';
import { CreateTenantDto, UpdateTenantDto } from './dto/tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto, ownerUserId: string) {
    const slug = this.normalizeSlug(dto.slug);

    const existing = await this.prisma.tenant.findUnique({ where: { slug } });
    if (existing && !existing.isDeleted) {
      throw new ConflictException(`Tenant with slug "${slug}" already exists`);
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug,
        domain: dto.domain || '',
        logoUrl: dto.logoUrl || '',
        plan: dto.plan,
        contactEmail: dto.contactEmail || '',
        billingEmail: dto.billingEmail || '',
        maxUsers: dto.maxUsers ?? 0,
        maxProperties: dto.maxProperties ?? 0,
        ownerUserId,
        settings: {},
      },
    });

    return mapRecord(tenant);
  }

  async findAll() {
    const tenants = await this.prisma.tenant.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });

    return mapRecords(tenants);
  }

  async findById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant || tenant.isDeleted) {
      throw new NotFoundException('Tenant not found');
    }

    return mapRecord(tenant);
  }

  async findBySlug(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || tenant.isDeleted) {
      throw new NotFoundException('Tenant not found');
    }

    return mapRecord(tenant);
  }

  async findByIds(ids: string[]) {
    const tenants = await this.prisma.tenant.findMany({
      where: {
        id: { in: ids },
        isDeleted: false,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return mapRecords(tenants);
  }

  async findByOwner(ownerUserId: string) {
    const tenants = await this.prisma.tenant.findMany({
      where: { ownerUserId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
    });

    return mapRecords(tenants);
  }

  async update(id: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant || tenant.isDeleted) {
      throw new NotFoundException('Tenant not found');
    }

    const updated = await this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.slug !== undefined ? { slug: this.normalizeSlug(dto.slug) } : {}),
        ...(dto.domain !== undefined ? { domain: dto.domain } : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
        ...(dto.plan !== undefined ? { plan: dto.plan } : {}),
        ...(dto.contactEmail !== undefined ? { contactEmail: dto.contactEmail } : {}),
        ...(dto.billingEmail !== undefined ? { billingEmail: dto.billingEmail } : {}),
        ...(dto.maxUsers !== undefined ? { maxUsers: dto.maxUsers } : {}),
        ...(dto.maxProperties !== undefined ? { maxProperties: dto.maxProperties } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.mpesaClientId !== undefined ? { mpesaClientId: dto.mpesaClientId } : {}),
      },
    });

    return mapRecord(updated);
  }

  async remove(id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant || tenant.isDeleted) {
      throw new NotFoundException('Tenant not found');
    }

    await this.prisma.tenant.update({
      where: { id },
      data: { isDeleted: true, isActive: false },
    });

    return { message: 'Tenant deleted successfully' };
  }

  private normalizeSlug(slug: string) {
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
