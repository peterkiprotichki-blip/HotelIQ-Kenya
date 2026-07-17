import { IsNotEmpty, IsNumber, Min, Max, ValidateNested, IsString, IsOptional, Matches, IsEmail } from 'class-validator';
import { Type } from 'class-transformer';

export class CoordinatesDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng: number;
}

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  county: string;

  @IsString()
  @IsNotEmpty()
  town: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  @IsNotEmpty()
  coordinates: CoordinatesDto;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:\+254|0)[17]\d{8}$/, { message: 'Invalid Kenyan phone format. Must start with +254 or 0, followed by 1 or 7 and 8 digits.' })
  contactPhone: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;
}
