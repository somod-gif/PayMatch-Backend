import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

/**
 * DTO for Business Owner registration
 */
export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @IsString()
  businessName!: string;

  @IsString()
  phone?: string;
}

/**
 * DTO for Business Owner login
 */
export class LoginDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @IsString()
  password!: string;
}
