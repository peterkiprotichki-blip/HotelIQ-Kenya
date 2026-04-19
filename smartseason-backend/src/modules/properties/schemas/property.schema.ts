import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseDocument } from '../../database/schemas/base.schema';

export enum PropertyType {
  APARTMENT = 'apartment',
  HOUSE = 'house',
  COMMERCIAL = 'commercial',
  LAND = 'land',
  BEDSITTER = 'bedsitter',
  SINGLE_ROOM = 'single_room',
  ONE_BEDROOM = 'one_bedroom',
  TWO_BEDROOM = 'two_bedroom',
  THREE_BEDROOM = 'three_bedroom',
}

export enum PropertyStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

@Schema({ timestamps: true })
export class Property extends BaseDocument {
  @Prop({ required: true })
  tenantId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, sparse: true })
  propertyCode: string;

  @Prop({ type: String, enum: PropertyType, default: PropertyType.APARTMENT })
  type: PropertyType;

  @Prop({ type: String, enum: PropertyStatus, default: PropertyStatus.ACTIVE })
  status: PropertyStatus;

  @Prop({ required: true })
  address: string;

  @Prop({ required: false, default: '' })
  description: string;

  @Prop({ required: false, default: '' })
  owner: string;

  @Prop({ required: false, default: 0 })
  yearBuilt: number;

  @Prop({ type: [String], default: [] })
  amenities: string[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ required: false, default: 0 })
  floors: number; // Number of floors in the property (0 = ground floor only)

  // ─── NOTE: currentTenantId and currentLeaseId moved to Unit schema ───────
  // Properties no longer track occupancy directly; units do.
}

export const PropertySchema = SchemaFactory.createForClass(Property);
PropertySchema.index({ tenantId: 1 });
PropertySchema.index({ status: 1 });
PropertySchema.index({ type: 1 });
PropertySchema.index({ propertyCode: 1, tenantId: 1 }, { unique: true, sparse: true });
