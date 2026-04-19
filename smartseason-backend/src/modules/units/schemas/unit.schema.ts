import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes } from 'mongoose';
import { BaseDocument } from '../../database/schemas/base.schema';

export enum UnitStatus {
  VACANT = 'vacant',
  OCCUPIED = 'occupied',
  MAINTENANCE = 'maintenance',
  RESERVED = 'reserved',
}

export enum UnitType {
  BEDSITTER = 'bedsitter',
  SINGLE_ROOM = 'single_room',
  ONE_BEDROOM = 'one_bedroom',
  TWO_BEDROOM = 'two_bedroom',
  THREE_BEDROOM = 'three_bedroom',
}

export enum RentCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
}

@Schema({ timestamps: true })
export class Unit extends BaseDocument {
  @Prop({ required: true })
  tenantId: string; // System tenant (organization)

  @Prop({ required: true })
  propertyId: string;

  @Prop({ required: true })
  unitNumber: string;

  @Prop({ required: false, default: '' })
  description: string;

  @Prop({ type: String, enum: UnitType, default: UnitType.ONE_BEDROOM })
  unitType: UnitType;

  @Prop({ type: SchemaTypes.Mixed, required: false, default: 0 })
  floor: number | string; // 0 or "G" for ground floor, 1, 2, 3 etc.

  @Prop({ type: String, enum: UnitStatus, default: UnitStatus.VACANT })
  status: UnitStatus;

  @Prop({ required: true })
  rentAmount: number;

  @Prop({ required: false, default: 'KES' })
  currency: string;

  @Prop({ required: false, default: 0 })
  securityDeposit: number;

  @Prop({ required: false, default: '' })
  electricityMeterNumber: string;

  @Prop({ required: false, default: '' })
  waterMeterNumber: string;

  @Prop({ type: String, enum: RentCycle, default: RentCycle.MONTHLY })
  rentCycle: RentCycle;

  @Prop({ required: false, default: '' })
  currentTenantId: string;

  @Prop({ required: false, default: '' })
  currentLeaseId: string;

  @Prop({ required: false, default: '' })
  currentPropertyTenantId: string; // Keep track of PropertyTenant for backward compatibility
}

export const UnitSchema = SchemaFactory.createForClass(Unit);
UnitSchema.index({ tenantId: 1 });
UnitSchema.index({ propertyId: 1 });
UnitSchema.index({ status: 1 });
UnitSchema.index({ unitNumber: 1, propertyId: 1 }); // Unique unit number per property
