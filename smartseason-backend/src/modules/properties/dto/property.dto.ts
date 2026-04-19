import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsArray } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { PropertyType, PropertyStatus } from '../schemas/property.schema';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  propertyCode?: string; // Optional - will be auto-generated if not provided

  @IsEnum(PropertyType)
  @IsOptional()
  type?: PropertyType;

  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  owner?: string;

  @IsNumber()
  @IsOptional()
  yearBuilt?: number;

  @IsArray()
  @IsOptional()
  amenities?: string[];

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsNumber()
  @IsOptional()
  floors?: number; // Number of floors in the property
}

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {
  @IsEnum(PropertyStatus)
  @IsOptional()
  status?: PropertyStatus;
}
