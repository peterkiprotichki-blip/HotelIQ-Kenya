import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsArray, IsDateString, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { LeaseStatus, PaymentFrequency } from '../schemas/lease.schema';

export class CreateLeaseDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsNotEmpty()
  unitId: string;

  @IsString()
  @IsNotEmpty()
  propertyTenantId: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsNotEmpty()
  rentAmount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @IsOptional()
  depositAmount?: number;

  @IsEnum(PaymentFrequency)
  @IsOptional()
  paymentFrequency?: PaymentFrequency;

  @IsNumber()
  @IsOptional()
  paymentDueDay?: number;

  @IsNumber()
  @IsOptional()
  lateFeeAmount?: number;

  @IsNumber()
  @IsOptional()
  gracePeriodDays?: number;

  @IsString()
  @IsOptional()
  terms?: string;

  @IsArray()
  @IsOptional()
  documents?: string[];

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

export class UpdateLeaseDto extends PartialType(CreateLeaseDto) {
  @IsEnum(LeaseStatus)
  @IsOptional()
  status?: LeaseStatus;

  @IsBoolean()
  @IsOptional()
  depositPaid?: boolean;

  @IsString()
  @IsOptional()
  terminationReason?: string;
}
