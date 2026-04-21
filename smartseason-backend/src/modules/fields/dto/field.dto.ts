import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { FieldStage } from '../schemas/field.schema';

export class CreateFieldDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  cropType: string;

  @IsDateString()
  plantingDate: string;

  @IsEnum(FieldStage)
  @IsOptional()
  currentStage?: FieldStage;

  @IsDateString()
  @IsOptional()
  expectedHarvestDate?: string;

  @IsString()
  @IsNotEmpty()
  assignedAgentId: string;

  @IsString()
  @IsOptional()
  location?: string;
}

export class UpdateFieldDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  cropType?: string;

  @IsDateString()
  @IsOptional()
  plantingDate?: string;

  @IsEnum(FieldStage)
  @IsOptional()
  currentStage?: FieldStage;

  @IsDateString()
  @IsOptional()
  expectedHarvestDate?: string;

  @IsString()
  @IsOptional()
  assignedAgentId?: string;

  @IsString()
  @IsOptional()
  location?: string;
}

export class AddFieldUpdateDto {
  @IsEnum(FieldStage)
  @IsOptional()
  stage?: FieldStage;

  @IsString()
  @MinLength(2)
  note: string;
}

export class UpdateFieldNoteDto {
  @IsString()
  @MinLength(2)
  note: string;
}
