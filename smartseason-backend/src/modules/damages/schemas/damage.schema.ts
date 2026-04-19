import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from '../../database/schemas/base.schema';

export enum DamageStatus {
  REPORTED = 'reported',
  ASSESSED = 'assessed',
  IN_REPAIR = 'in_repair',
  REPAIRED = 'repaired',
  DEDUCTED = 'deducted',
  CLOSED = 'closed',
}

export enum DamageSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum DamageType {
  STRUCTURAL = 'structural',
  PLUMBING = 'plumbing',
  ELECTRICAL = 'electrical',
  APPLIANCE = 'appliance',
  COSMETIC = 'cosmetic',
  FIXTURE = 'fixture',
  FLOORING = 'flooring',
  WINDOW_DOOR = 'window_door',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class Damage extends BaseDocument {
  @Prop({ required: true })
  tenantId: string;

  @Prop({ required: true })
  propertyId: string;

  @Prop({ required: false, default: '' })
  propertyTenantId: string;

  @Prop({ required: false, default: '' })
  leaseId: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: DamageType, default: DamageType.OTHER })
  damageType: DamageType;

  @Prop({ type: String, enum: DamageSeverity, default: DamageSeverity.MEDIUM })
  severity: DamageSeverity;

  @Prop({ type: String, enum: DamageStatus, default: DamageStatus.REPORTED })
  status: DamageStatus;

  @Prop({ required: false, default: 0 })
  estimatedCost: number;

  @Prop({ required: false, default: 0 })
  actualCost: number;

  @Prop({ required: false, default: 'KES' })
  currency: string;

  @Prop({ required: true })
  reportedDate: Date;

  @Prop({ required: false })
  assessedDate: Date;

  @Prop({ required: false })
  repairedDate: Date;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ required: false, default: '' })
  location: string; // e.g. "Kitchen", "Master Bedroom"

  @Prop({ required: false, default: '' })
  notes: string;

  @Prop({ required: false, default: '' })
  repairVendor: string;

  @Prop({ default: false })
  deductedFromDeposit: boolean;

  @Prop({ required: false, default: '' })
  propertyName: string;

  @Prop({ required: false, default: '' })
  propertyTenantName: string;

  @Prop({ required: false, default: '' })
  reportedBy: string;
}

export const DamageSchema = SchemaFactory.createForClass(Damage);
DamageSchema.index({ tenantId: 1 });
DamageSchema.index({ propertyId: 1 });
DamageSchema.index({ propertyTenantId: 1 });
DamageSchema.index({ status: 1 });
DamageSchema.index({ severity: 1 });
