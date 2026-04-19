import { IsString, IsOptional, IsEnum, IsArray, IsDate, IsNumber } from 'class-validator';
import { MaintenanceRequestStatus, MaintenanceRequestPriority } from '../schemas/maintenance-request.schema';

export class CreateMaintenanceRequestDto {
  @IsString()
  unitId: string;

  @IsString()
  propertyId: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(MaintenanceRequestPriority)
  @IsOptional()
  priority?: MaintenanceRequestPriority;

  @IsArray()
  @IsOptional()
  attachments?: string[];

  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;
}

export class UpdateMaintenanceRequestDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(MaintenanceRequestStatus)
  @IsOptional()
  status?: MaintenanceRequestStatus;

  @IsEnum(MaintenanceRequestPriority)
  @IsOptional()
  priority?: MaintenanceRequestPriority;

  @IsString()
  @IsOptional()
  assignedToUserId?: string;

  @IsString()
  @IsOptional()
  completionNotes?: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];

  @IsDate()
  @IsOptional()
  dueDate?: Date;

  @IsNumber()
  @IsOptional()
  estimatedCost?: number;
}

export class CompleteMaintenanceRequestDto {
  @IsString()
  completionNotes: string;

  @IsArray()
  @IsOptional()
  attachments?: string[];
}
