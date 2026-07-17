import { IsNotEmpty, IsString, IsOptional, IsBoolean, IsDateString, IsNumber, Min, Max, IsEnum, IsArray } from 'class-validator';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(['public-holiday', 'festival', 'sports', 'cultural', 'wildlife-season', 'conference'])
  category: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsNotEmpty()
  county: string;

  @IsString()
  @IsNotEmpty()
  town: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  regionRelevance?: string[];

  @IsString()
  @IsNotEmpty()
  @IsEnum(['low', 'medium', 'high'])
  demandImpact: string;

  @IsBoolean()
  @IsOptional()
  isNational?: boolean;
}
