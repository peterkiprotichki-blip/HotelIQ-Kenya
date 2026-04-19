import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class PortalSetupPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(6)
  password: string;
}

export class PortalLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdatePortalProfileDto {
  @IsString()
  @IsNotEmpty()
  phone: string;
}
