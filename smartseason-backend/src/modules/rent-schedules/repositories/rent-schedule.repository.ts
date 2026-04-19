import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../database/repositories/base.repository';
import { RentSchedule } from '../schemas/rent-schedule.schema';

@Injectable()
export class RentScheduleRepository extends BaseRepository<RentSchedule> {
  constructor(@InjectModel(RentSchedule.name) model: Model<RentSchedule>) {
    super(model);
  }

  async findByLease(tenantId: string, leaseId: string): Promise<RentSchedule[]> {
    return this.model
      .find({ tenantId, leaseId, isDeleted: false })
      .sort({ dueDate: 1 })
      .exec();
  }

  async findByProperty(tenantId: string, propertyId: string): Promise<RentSchedule[]> {
    return this.model
      .find({ tenantId, propertyId, isDeleted: false })
      .sort({ dueDate: -1 })
      .exec();
  }

  async findByUnit(tenantId: string, unitId: string): Promise<RentSchedule[]> {
    return this.model
      .find({ tenantId, unitId, isDeleted: false })
      .sort({ dueDate: 1 })
      .exec();
  }

  async findOverdue(tenantId: string): Promise<RentSchedule[]> {
    const now = new Date();
    return this.model
      .find({
        tenantId,
        dueWithGracePeriodDate: { $lt: now },
        status: { $in: ['unpaid', 'partial'] },
        isDeleted: false,
      })
      .sort({ dueDate: 1 })
      .exec();
  }

  async findByStatus(tenantId: string, status: string): Promise<RentSchedule[]> {
    return this.model
      .find({ tenantId, status, isDeleted: false })
      .sort({ dueDate: -1 })
      .exec();
  }

  async findNextUnpaidSchedule(leaseId: string): Promise<RentSchedule | null> {
    const now = new Date();
    return this.model
      .findOne({
        leaseId,
        status: { $in: ['unpaid', 'partial'] },
        dueDate: { $lte: now },
        isDeleted: false,
      })
      .sort({ dueDate: 1 })
      .exec();
  }

  async getTotalByLease(tenantId: string, leaseId: string): Promise<{
    totalDue: number;
    totalPaid: number;
    totalOverdue: number;
  }> {
    const schedules = await this.findByLease(tenantId, leaseId);
    let totalDue = 0;
    let totalPaid = 0;
    let totalOverdue = 0;

    const now = new Date();
    schedules.forEach((schedule) => {
      totalDue += schedule.amount;
      totalPaid += schedule.paidAmount;
      if (schedule.status === 'overdue' || (schedule.dueWithGracePeriodDate && schedule.dueWithGracePeriodDate < now)) {
        totalOverdue += schedule.amount - schedule.paidAmount;
      }
    });

    return { totalDue, totalPaid, totalOverdue };
  }

  async countByStatus(tenantId: string, status: string): Promise<number> {
    return this.model.countDocuments({ tenantId, status, isDeleted: false });
  }
}
