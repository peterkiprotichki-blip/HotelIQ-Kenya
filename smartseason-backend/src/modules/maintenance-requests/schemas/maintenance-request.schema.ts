import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from '../../database/schemas/base.schema';

export enum MaintenanceRequestStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REJECTED = 'rejected',
}

export enum MaintenanceRequestPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Schema({ timestamps: true })
export class MaintenanceRequest extends BaseDocument {
  @Prop({ required: true })
  tenantId: string; // System tenant (organization)

  @Prop({ required: true })
  propertyTenantId: string; // Rental tenant who reported the issue

  @Prop({ required: true })
  unitId: string;

  @Prop({ required: true })
  propertyId: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: String, enum: MaintenanceRequestStatus, default: MaintenanceRequestStatus.PENDING })
  status: MaintenanceRequestStatus;

  @Prop({ type: String, enum: MaintenanceRequestPriority, default: MaintenanceRequestPriority.MEDIUM })
  priority: MaintenanceRequestPriority;

  @Prop({ type: [String], default: [] })
  attachments: string[];

  @Prop({ required: false })
  assignedToUserId: string;

  @Prop({ required: false })
  completedAt: Date;

  @Prop({ required: false })
  completionNotes: string;

  @Prop({ required: false, default: '' })
  propertyTenantName: string;

  @Prop({ required: false, default: '' })
  unitNumber: string;

  @Prop({ required: false })
  dueDate: Date;

  @Prop({ required: false })
  estimatedCost: number;
}

export const MaintenanceRequestSchema = SchemaFactory.createForClass(MaintenanceRequest);
MaintenanceRequestSchema.index({ tenantId: 1 });
MaintenanceRequestSchema.index({ propertyTenantId: 1 });
MaintenanceRequestSchema.index({ unitId: 1 });
MaintenanceRequestSchema.index({ propertyId: 1 });
MaintenanceRequestSchema.index({ status: 1 });
MaintenanceRequestSchema.index({ createdAt: -1 });
