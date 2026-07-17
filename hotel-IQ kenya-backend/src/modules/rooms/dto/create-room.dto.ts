import { IsNotEmpty, IsNumber, Min, IsString, IsArray, IsOptional } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @IsString()
  @IsNotEmpty()
  roomType: string;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsNumber()
  @Min(1)
  capacity: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[];
}
