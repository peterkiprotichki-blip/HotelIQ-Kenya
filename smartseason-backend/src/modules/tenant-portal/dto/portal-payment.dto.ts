import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class InitiateMpesaPaymentDto {
  @IsString()
  @IsNotEmpty()
  phoneNumber: string; // editable by tenant, e.g. 0712345678 or 254712345678

  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsNotEmpty()
  leaseId: string;

  @IsString()
  @IsOptional()
  paymentPeriod?: string; // e.g. "March 2026"

  @IsString()
  @IsOptional()
  notes?: string;
}
