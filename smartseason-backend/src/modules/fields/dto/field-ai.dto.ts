import { IsOptional, IsString, MinLength } from 'class-validator';

export class FieldAiInsightDto {
  @IsString()
  @IsOptional()
  @MinLength(3)
  focus?: string;
}