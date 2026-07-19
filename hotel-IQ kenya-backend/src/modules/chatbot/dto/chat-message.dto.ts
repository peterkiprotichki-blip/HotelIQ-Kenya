import { IsNotEmpty, IsString, IsOptional, IsArray, IsDateString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  propertyId?: string;

  @IsArray()
  @IsOptional()
  context?: { role: 'user' | 'assistant'; content: string }[];

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  userLat?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  userLng?: number;
}

export class CompareRoomsDto {
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @IsDateString()
  @IsNotEmpty()
  checkIn: string;

  @IsDateString()
  @IsNotEmpty()
  checkOut: string;
}
