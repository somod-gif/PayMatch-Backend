import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

/**
 * Response DTO for payment link
 */
export class PaymentLinkResponseDto {
  @ApiProperty({ example: 'INV-001' })
  invoiceNumber!: string;

  @ApiProperty({ example: 'https://paymatch-frontend.vercel.app/pay/INV-001' })
  paymentUrl!: string;
}

/**
 * Response DTO for payment share information
 */
export class PaymentShareResponseDto {
  @ApiProperty({ example: 'John Doe' })
  customer!: string;

  @ApiProperty({ example: 'john@example.com' })
  email!: string;

  @ApiProperty({ example: '08031234567', nullable: true })
  phone!: string | null;

  @ApiProperty({ example: 150000 })
  amount!: number;

  @ApiProperty({ example: 'NGN' })
  currency!: string;

  @ApiProperty({ example: 'Wema Bank' })
  bank!: string;

  @ApiProperty({ example: '1234567890' })
  accountNumber!: string;

  @ApiProperty({ example: 'John Doe INV001' })
  accountName!: string;

  @ApiProperty({ example: 'https://paymatch-frontend.vercel.app/pay/INV-001' })
  paymentLink!: string;

  @ApiProperty({ example: 'Hello John,...' })
  whatsappMessage!: string;

  @ApiProperty({ example: 'https://wa.me/?text=...' })
  whatsappUrl!: string;

  @ApiProperty({ example: 'Invoice INV-001 - Payment Request' })
  emailSubject!: string;

  @ApiProperty({ example: '<h2>Invoice Payment Request</h2>...' })
  emailBody!: string;

  @ApiProperty({ example: 'Invoice: INV-001\nAmount: ₦150,000\n...' })
  copyText!: string;
}

/**
 * DTO for sending email
 */
export class SendEmailDto {
  @ApiProperty({ example: 'customer@email.com', description: 'Customer email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsString()
  email!: string;
}

/**
 * Response DTO for email sending
 */
export class EmailResponseDto {
  @ApiProperty({ example: true })
  success!: boolean;

  @ApiProperty({ example: 'Invoice email sent successfully.' })
  message!: string;
}
