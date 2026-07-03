import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Invoice ID to associate payment with' })
  @IsString()
  invoiceId!: string;

  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId!: string;

  @ApiProperty({ description: 'Merchant transaction reference (unique)' })
  @IsString()
  merchantTxRef!: string;

  @ApiProperty({ example: 50000, description: 'Payment amount in NGN' })
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiPropertyOptional({ default: 'NGN', description: 'Currency code' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ enum: ['transfer', 'ussd', 'card'], description: 'Payment method' })
  @IsEnum(['transfer', 'ussd', 'card'])
  @IsOptional()
  paymentMethod?: string;
}

export class QueryPaymentDto {
  @ApiPropertyOptional({ description: 'Filter by invoice ID' })
  @IsString()
  @IsOptional()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Filter by customer ID' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ enum: ['pending', 'success', 'failed', 'refunded'], description: 'Filter by status' })
  @IsEnum(['pending', 'success', 'failed', 'refunded'])
  @IsOptional()
  status?: string;
}