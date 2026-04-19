import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from '../../database/schemas/base.schema';

export enum ScheduleStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Schema({ timestamps: true })
export class RentSchedule extends BaseDocument {
  @Prop({ required: true })
  tenantId: string; // System tenant (organization)

  @Prop({ required: true })
  leaseId: string; // Reference to lease

  @Prop({ required: true })
  propertyId: string;

  @Prop({ required: true })
  unitId: string;

  @Prop({ required: true })
  dueDate: Date;

  @Prop({ required: true })
  amount: number; // Total amount due for the month

  @Prop({ required: false, default: 0 })
  paidAmount: number; // Total amount paid so far

  @Prop({ type: String, enum: ScheduleStatus, default: ScheduleStatus.UNPAID })
  status: ScheduleStatus;

  @Prop({ required: false, default: '' })
  month: string; // e.g., "2026-03" for March 2026

  @Prop({ required: false })
  dueWithGracePeriodDate?: Date; // Due date + grace period

  @Prop({ required: false, default: 0 })
  lateFeeApplied: number; // Late fees applied to this schedule

  @Prop({ type: [Object], default: [] })
  payments: Array<{
    paymentId: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
  }>; // Track individual payments applied
}

export const RentScheduleSchema = SchemaFactory.createForClass(RentSchedule);
