import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId!: string;

  @ApiProperty({ example: 'INV-001', description: 'Invoice number' })
  @IsString()
  invoiceNumber!: string;

  @ApiProperty({ example: 50000, description: 'Invoice amount in NGN' })
  @IsNumber()
  @Min(0)
  expectedAmount!: number;

  @ApiPropertyOptional({ default: 'NGN', description: 'Currency code' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 'Payment for services rendered', description: 'Invoice description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Invoice due date' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class UpdateInvoiceDto {
  @ApiPropertyOptional({ example: 75000, description: 'Invoice amount in NGN' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  expectedAmount?: number;

  @ApiPropertyOptional({ description: 'Invoice description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ['pending', 'paid', 'overdue', 'cancelled', 'partial'], description: 'Invoice status' })
  @IsEnum(['pending', 'paid', 'overdue', 'cancelled', 'partial'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Invoice due date' })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
