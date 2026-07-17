import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum, IsBoolean, IsArray } from 'class-validator';
import { RentiumUserRole, Permission } from '../schemas/rentium-user.schema';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(RentiumUserRole)
  @IsOptional()
  role?: RentiumUserRole;

  @IsArray()
  @IsOptional()
  permissions?: Permission[];
}

export class InviteUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(RentiumUserRole)
  @IsOptional()
  role?: RentiumUserRole;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsArray()
  @IsOptional()
  tenantIds?: string[];

  @IsArray()
  @IsOptional()
  permissions?: Permission[];
}

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(RentiumUserRole)
  @IsOptional()
  role?: RentiumUserRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  assignedPropertyIds?: string[];

  @IsArray()
  @IsOptional()
  permissions?: Permission[];

  @IsArray()
  @IsOptional()
  tenantIds?: string[];

  @IsString()
  @IsOptional()
  activeTenantId?: string;
}
