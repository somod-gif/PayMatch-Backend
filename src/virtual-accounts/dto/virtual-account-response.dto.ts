import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VirtualAccountDetailsDto {
  @ApiProperty({ example: 'Wema Bank' })
  bankName!: string;

  @ApiProperty({ example: '1234567890' })
  accountNumber!: string;

  @ApiProperty({ example: 'John Doe' })
  accountName!: string;

  @ApiProperty({ example: 5000 })
  amount!: number;

  @ApiProperty({ example: 'INV-001-1720000000000' })
  accountRef!: string;

  @ApiProperty({ example: 'NGN' })
  currency!: string;

  @ApiProperty({ example: 'PENDING' })
  paymentStatus!: 'PENDING';
}

export class CreateVirtualAccountResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Virtual account generated successfully.' })
  message!: string;

  @ApiProperty({ type: VirtualAccountDetailsDto })
  data!: VirtualAccountDetailsDto;
}

export class VirtualAccountListItemDto {
  @ApiProperty({ example: '0560f17a-9a56-44cb-8cce-5b2e151c3ff2' })
  id!: string;

  @ApiProperty({ example: 'bd9e2448-e1f3-4966-8812-8072b8809426' })
  invoiceId!: string;

  @ApiProperty({ example: '2bd8264f-6e9d-463f-9998-6c8c80ca0233' })
  customerId!: string;

  @ApiProperty({ example: 'INV-001-1720000000000' })
  accountRef!: string;

  @ApiProperty({ example: 'Wema Bank' })
  bankName!: string;

  @ApiProperty({ example: '1234567890' })
  bankAccountNumber!: string;

  @ApiProperty({ example: 'John Doe' })
  bankAccountName!: string;

  @ApiProperty({ example: 'NGN' })
  currency!: string;

  @ApiProperty({ example: 5000 })
  expectedAmount!: string;

  @ApiProperty({ example: '1234567890' })
  nombaAccountNumber!: string;

  @ApiProperty({ example: 'John Doe' })
  accountName!: string;

  @ApiProperty({ example: 'INV-001-1720000000000' })
  accountReference!: string;

  @ApiPropertyOptional({ example: '2026-07-08T10:27:46.772Z', nullable: true })
  expiryDate!: string | null;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: '2026-07-08T10:27:46.772Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-07-08T10:27:46.772Z' })
  updatedAt!: string;
}

export class ListVirtualAccountsResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ type: [VirtualAccountListItemDto] })
  data!: VirtualAccountListItemDto[];
}