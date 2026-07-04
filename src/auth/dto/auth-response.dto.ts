import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO for Business Owner data
 */
export class BusinessOwnerResponseDto {
  @ApiProperty({ example: '80b92c16-358f-43fa-b79f-12a398c3e13a' })
  id!: string;

  @ApiProperty({ example: 'business@example.com' })
  email!: string;

  @ApiProperty({ example: 'Acme Business Ltd' })
  businessName!: string;

  @ApiProperty({ example: '+2348012345678', nullable: true })
  phone?: string;

  @ApiProperty({ example: 'active', enum: ['active', 'inactive', 'suspended'] })
  status!: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt!: Date;
}

/**
 * Response wrapper for API responses
 */
export class ApiResponseDto<T> {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Operation successful' })
  message?: string;

  @ApiProperty()
  data?: T;
}