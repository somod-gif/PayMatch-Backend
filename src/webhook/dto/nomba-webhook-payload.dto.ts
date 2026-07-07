import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for Nomba webhook payload validation.
 * Defines the expected structure of incoming webhook events from Nomba.
 *
 * Event Types:
 * - payment.success: Payment completed successfully
 * - virtual_account.funding: Virtual account received funds
 * - transfer.success: Transfer completed successfully
 * - transfer.failed: Transfer failed
 */
export class NombaWebhookPayloadDto {
  /**
   * The event type identifier (e.g., "payment.success", "virtual_account.funding").
   */
  @ApiProperty({ 
    description: 'Event type identifier', 
    example: 'payment.success',
    enum: ['payment.success', 'virtual_account.funding', 'transfer.success', 'transfer.failed']
  })
  @IsString()
  event!: string;

  /**
   * Unique request identifier for idempotency handling.
   * Used to prevent duplicate processing of the same event.
   */
  @ApiPropertyOptional({ 
    description: 'Unique request ID for idempotency', 
    example: 'req_abc123' 
  })
  @IsString()
  @IsOptional()
  requestId?: string;

  /**
   * The main payload data containing event-specific details.
   * Structure varies based on the event type.
   */
  @ApiPropertyOptional({ 
    description: 'Event-specific payload data',
    example: {
      reference: 'TXN_123456',
      amount: 50000,
      invoiceNumber: 'INV-001',
      customerEmail: 'customer@example.com'
    }
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  /**
   * Raw payload object for flexible webhook handling.
   * Allows forward compatibility with undocumented fields.
   */
  @ApiPropertyOptional({ 
    description: 'Raw webhook payload for forward compatibility' 
  })
  @IsObject()
  @IsOptional()
  raw?: Record<string, unknown>;
}
