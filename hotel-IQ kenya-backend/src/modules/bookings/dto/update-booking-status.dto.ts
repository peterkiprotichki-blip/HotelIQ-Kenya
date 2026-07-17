import { IsNotEmpty, IsString, IsEnum } from 'class-validator';

export class UpdateBookingStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsEnum(['confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'])
  status: string;
}
