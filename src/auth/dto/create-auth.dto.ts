import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for Business Owner registration
 */
export class RegisterDto {
  @ApiProperty({ example: 'business@example.com', description: 'Business owner email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Password (min 6 characters)' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @ApiProperty({ example: 'Acme Business Ltd', description: 'Business name' })
  @IsString()
  businessName!: string;

  @ApiPropertyOptional({ example: '+2348012345678', description: 'Business phone number' })
  @IsString()
  @IsOptional()
  phone?: string;
}

/**
 * DTO for Business Owner login
 */
export class LoginDto {
  @ApiProperty({ example: 'business@example.com', description: 'Business owner email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @ApiProperty({ example: 'password123', description: 'Password' })
  @IsString()
  password!: string;
}
