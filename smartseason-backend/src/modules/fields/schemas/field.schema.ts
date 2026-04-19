import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from '../../database/schemas/base.schema';

export enum FieldStage {
  PLANTED = 'planted',
  GROWING = 'growing',
  READY = 'ready',
  HARVESTED = 'harvested',
}

export enum FieldStatus {
  ACTIVE = 'active',
  AT_RISK = 'at_risk',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class Field extends BaseDocument {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  cropType: string;

  @Prop({ required: true })
  plantingDate: Date;

  @Prop({ type: String, enum: FieldStage, default: FieldStage.PLANTED })
  currentStage: FieldStage;

  @Prop({ type: String, enum: FieldStatus, default: FieldStatus.ACTIVE })
  status: FieldStatus;

  @Prop({ required: true })
  assignedAgentId: string;

  @Prop({ required: false, default: '' })
  description: string;

  @Prop({ required: false, default: 0 })
  areaSize: number; // in hectares or acres

  @Prop({ required: false, default: '' })
  location: string;

  @Prop({ type: [String], default: [] })
  notes: string[];

  @Prop({ required: false, default: null })
  expectedHarvestDate: Date;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const FieldSchema = SchemaFactory.createForClass(Field);
