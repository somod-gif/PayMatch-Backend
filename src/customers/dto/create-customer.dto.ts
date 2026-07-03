import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ example: 'john@example.com', description: 'Customer email address' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'John Doe', description: 'Customer full name' })
  @IsString()
  @MinLength(2)
  fullName!: string;

  @ApiPropertyOptional({ example: '+2348012345678', description: 'Customer phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'CUST-001', description: 'Business-specific customer reference' })
  @IsString()
  @IsOptional()
  customerReference?: string;
}

export class UpdateCustomerDto {
  @ApiPropertyOptional({ example: 'John Doe', description: 'Customer full name' })
  @IsString()
  @MinLength(2)
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: '+2348012345678', description: 'Customer phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'inactive'] })
  @IsEnum(['active', 'inactive'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'CUST-001', description: 'Business-specific customer reference' })
  @IsString()
  @IsOptional()
  customerReference?: string;
}
