import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { LeaseRepository } from './repositories/lease.repository';
import { CreateLeaseDto, UpdateLeaseDto } from './dto/lease.dto';
import { UnitsService } from '../units/units.service';
import { PropertyTenantsService } from '../property-tenants/property-tenants.service';
import { RentSchedulesService } from '../rent-schedules/rent-schedules.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LeasesService {
  constructor(
    private readonly leaseRepository: LeaseRepository,
    private readonly unitsService: UnitsService,
    private readonly propertyTenantsService: PropertyTenantsService,
    private readonly rentSchedulesService: RentSchedulesService,
  ) {}

  async create(dto: CreateLeaseDto, tenantId: string) {
    // Validate unit exists and is available
    if (dto.unitId) {
      const activeLease = await this.leaseRepository.findActiveByUnit(dto.unitId, tenantId);
      if (activeLease) {
        throw new BadRequestException('This unit already has an active lease');
      }
    }

    // Validate property tenant exists and doesn't have active lease
    if (dto.propertyTenantId) {
      try {
        const propertyTenant = await this.propertyTenantsService.findById(dto.propertyTenantId, tenantId);
        if (!propertyTenant) {
          throw new BadRequestException('Property tenant not found');
        }
        if (propertyTenant.currentLeaseId) {
          throw new BadRequestException('This tenant already has an active lease. Please terminate the existing lease first.');
        }
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException('Unable to validate property tenant');
      }
    }

    // Generate sequential lease number: LS-0001, LS-0002, etc.
    const leaseNumber = await this.generateLeaseNumber(tenantId);
    const createdLease = await this.leaseRepository.create({
      ...dto,
      tenantId,
      leaseNumber,
      status: 'active', // Auto-activate lease on creation
      scheduleGenerated: false,
    } as any);

    // Update PropertyTenant with currentLeaseId and currentPropertyId
    if (dto.propertyTenantId && createdLease._id) {
      try {
        await this.propertyTenantsService.update(dto.propertyTenantId, tenantId, {
          currentLeaseId: createdLease._id.toString(),
          currentPropertyId: dto.propertyId || '',
        });
      } catch (error) {
        console.error('Failed to update PropertyTenant lease info:', error.message);
      }
    }

    // Update unit status to "occupied" if lease is created
    if (dto.unitId && createdLease._id) {
      try {
        await this.unitsService.assignTenant(
          dto.unitId,
          tenantId,
          dto.propertyTenantId,
          createdLease._id.toString(),
        );
      } catch (error) {
        // Log error but don't fail lease creation
        console.error('Failed to update unit occupancy during lease creation:', error.message);
      }
    }

    // Generate 12-month rent schedule automaticall
    if (createdLease._id && dto.rentAmount > 0) {
      try {
        const startDate = new Date(dto.startDate);
        await this.rentSchedulesService.generateSchedulesForLease(
          createdLease._id.toString(),
          tenantId,
          dto.propertyId,
          dto.unitId,
          startDate,
          dto.rentAmount,
          dto.gracePeriodDays || 5,
          12,
        );

        // Mark lease as having schedules generated
        await this.leaseRepository.update(createdLease._id.toString(), {
          scheduleGenerated: true,
          scheduleGeneratedAt: new Date(),
        } as any);
      } catch (error) {
        console.error('Failed to generate rent schedule:', error.message);
        // Don't fail lease creation if schedule generation fails
      }
    }

    return createdLease;
  }

  async findAll(tenantId: string, page = 1, limit = 20, search?: string, status?: string) {
    const filter: any = { tenantId };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { leaseNumber: { $regex: search, $options: 'i' } },
        { propertyName: { $regex: search, $options: 'i' } },
        { propertyTenantName: { $regex: search, $options: 'i' } },
      ];
    }
    return this.leaseRepository.findPaginated({ page, limit, filter });
  }

  async findById(id: string, tenantId: string) {
    const lease = await this.leaseRepository.findById(id);
    if (!lease || lease.isDeleted || lease.tenantId !== tenantId) {
      throw new NotFoundException('Lease not found');
    }
    return lease;
  }

  async findWithBalance(id: string, tenantId: string) {
    const lease = await this.findById(id, tenantId);
    const balance = await this.rentSchedulesService.getLeaseBalance(tenantId, id);
    const schedules = await this.rentSchedulesService.findByLease(tenantId, id);

    return {
      lease,
      balance,
      schedules,
    };
  }

  async findByProperty(tenantId: string, propertyId: string) {
    return this.leaseRepository.findByProperty(tenantId, propertyId);
  }

  async findByPropertyTenant(tenantId: string, propertyTenantId: string) {
    return this.leaseRepository.findByPropertyTenant(tenantId, propertyTenantId);
  }

  async findExpiringSoon(tenantId: string, days = 30) {
    return this.leaseRepository.findExpiringSoon(tenantId, days);
  }

  async findByUnit(tenantId: string, unitId: string) {
    return this.leaseRepository.findByUnit(tenantId, unitId);
  }

  async activate(id: string, tenantId: string) {
    const lease = await this.findById(id, tenantId);

    // Check if unit already has an active lease
    if (lease.unitId) {
      const activeLease = await this.leaseRepository.findActiveByUnit(lease.unitId, tenantId);
      if (activeLease && activeLease._id.toString() !== id) {
        throw new BadRequestException('This unit already has an active lease');
      }
    }

    const updated = await this.leaseRepository.update(id, { status: 'active' } as any);

    // If lease is for a unit, mark unit as occupied
    if (lease.unitId) {
      try {
        await this.unitsService.assignTenant(lease.unitId, tenantId, lease.propertyTenantId, id);
      } catch (error) {
        // Log error but don't fail the activation
        console.error('Failed to update unit occupancy:', error.message);
      }
    }

    return updated;
  }

  async terminate(id: string, tenantId: string, reason: string) {
    const lease = await this.findById(id, tenantId);

    const updated = await this.leaseRepository.update(id, {
      status: 'terminated',
      terminatedAt: new Date(),
      terminationReason: reason,
    } as any);

    // Clear PropertyTenant lease info
    if (lease.propertyTenantId) {
      try {
        await this.propertyTenantsService.update(lease.propertyTenantId, tenantId, {
          currentLeaseId: '',
          currentPropertyId: '',
        });
      } catch (error) {
        console.error('Failed to clear PropertyTenant lease info:', error.message);
      }
    }

    // If lease is for a unit, mark unit as vacant
    if (lease.unitId) {
      try {
        await this.unitsService.releaseTenant(lease.unitId, tenantId);
      } catch (error) {
        // Log error but don't fail the termination
        console.error('Failed to release unit occupancy:', error.message);
      }
    }

    return updated;
  }

  async update(id: string, tenantId: string, dto: UpdateLeaseDto) {
    await this.findById(id, tenantId);
    const lease = await this.leaseRepository.update(id, dto as any);
    if (!lease) throw new NotFoundException('Lease not found');
    return lease;
  }

  async remove(id: string, tenantId: string) {
    await this.findById(id, tenantId);
    return this.leaseRepository.delete(id);
  }

  async signLease(id: string, propertyTenantId: string, tenantId: string) {
    const lease = await this.findById(id, tenantId);
    
    // Validate that the tenant signing is the one on the lease
    if (lease.propertyTenantId !== propertyTenantId) {
      throw new BadRequestException('You cannot sign this lease');
    }

    const updated = await this.leaseRepository.update(id, {
      isSigned: true,
      signedAt: new Date(),
      signedByPropertyTenantId: propertyTenantId,
    } as any);

    return updated;
  }

  async getStats(tenantId: string) {
    const [total, active, expired, draft] = await Promise.all([
      this.leaseRepository.countByTenant(tenantId),
      this.leaseRepository.countByStatus(tenantId, 'active'),
      this.leaseRepository.countByStatus(tenantId, 'expired'),
      this.leaseRepository.countByStatus(tenantId, 'draft'),
    ]);
    const expiringSoon = await this.leaseRepository.findExpiringSoon(tenantId, 30);
    return { total, active, expired, draft, expiringSoonCount: expiringSoon.length };
  }

  private async generateLeaseNumber(tenantId: string): Promise<string> {
    try {
      // Find all leases for this tenant, sorted by creation date (most recent first)
      const leases = await this.leaseRepository.findByTenant(tenantId);
      
      let nextNumber = 1;
      if (leases && leases.length > 0) {
        const lastLease = leases[0]; // findByTenant returns sorted by createdAt desc
        // Extract number from lease number format "LS-XXXX"
        const match = lastLease.leaseNumber?.match(/LS-(\d+)/);
        if (match && match[1]) {
          const lastNumber = parseInt(match[1], 10);
          nextNumber = lastNumber + 1;
        }
      }

      // Format as LS-0001, LS-0002, etc.
      return `LS-${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      // Fallback to LS-0001 if there's an error
      console.error('Error generating lease number:', error.message);
      return `LS-0001`;
    }
  }
}
