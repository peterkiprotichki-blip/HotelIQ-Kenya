import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsArray, IsDateString, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { DamageStatus, DamageSeverity, DamageType } from '../schemas/damage.schema';

export class CreateDamageDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsOptional()
  propertyTenantId?: string;

  @IsString()
  @IsOptional()
  leaseId?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(DamageType)
  @IsOptional()
  damageType?: DamageType;

  @IsEnum(DamageSeverity)
  @IsOptional()
  severity?: DamageSeverity;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;

  @IsDateString()
  @IsNotEmpty()
  reportedDate: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  propertyName?: string;

  @IsString()
  @IsOptional()
  propertyTenantName?: string;
}

export class UpdateDamageDto extends PartialType(CreateDamageDto) {
  @IsEnum(DamageStatus)
  @IsOptional()
  status?: DamageStatus;

  @IsNumber()
  @IsOptional()
  actualCost?: number;

  @IsString()
  @IsOptional()
  repairVendor?: string;

  @IsBoolean()
  @IsOptional()
  deductedFromDeposit?: boolean;
}
