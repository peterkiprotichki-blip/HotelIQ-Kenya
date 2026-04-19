import { IsString, IsNotEmpty, IsOptional, IsEmail, IsArray, IsBoolean } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreatePropertyTenantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  idNumber?: string;

  @IsString()
  @IsOptional()
  kraPin?: string;

  @IsString()
  @IsOptional()
  emergencyContactName?: string;

  @IsString()
  @IsOptional()
  emergencyContactPhone?: string;

  @IsString()
  @IsOptional()
  occupation?: string;

  @IsString()
  @IsOptional()
  employer?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsArray()
  @IsOptional()
  documents?: string[];
}

export class UpdatePropertyTenantDto extends PartialType(CreatePropertyTenantDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  currentPropertyId?: string;

  @IsString()
  @IsOptional()
  currentLeaseId?: string;
}
