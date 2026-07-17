import { IsNotEmpty, IsString, IsOptional, IsEmail, IsDateString, Matches, IsEnum } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  guestName: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:\+254|0)[17]\d{8}$/, { message: 'Invalid Kenyan phone format. Must start with +254 or 0, followed by 1 or 7 and 8 digits.' })
  guestPhone: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  guestEmail?: string;

  @IsDateString()
  @IsNotEmpty()
  checkIn: string;

  @IsDateString()
  @IsNotEmpty()
  checkOut: string;

  @IsString()
  @IsOptional()
  @IsEnum(['direct', 'walk-in', 'phone', 'referral'])
  source?: string;
}
