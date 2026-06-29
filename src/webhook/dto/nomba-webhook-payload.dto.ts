import { IsString, IsOptional, IsObject } from 'class-validator';

/**
 * DTO for Nomba webhook payload validation.
 * Defines the expected structure of incoming webhook events from Nomba.
 *
 * TODO: Extend with specific event types as they are documented:
 * - PaymentSuccessEvent: Add amount, currency, reference, status fields
 * - VirtualAccountFundingEvent: Add accountNumber, amount, sender fields
 * - TransferSuccessEvent: Add transferReference, recipient, amount fields
 * - TransferFailedEvent: Add failureReason, transferReference fields
 */
export class NombaWebhookPayloadDto {
  /**
   * The event type identifier (e.g., "payment.success", "virtual_account.funding").
   */
  @IsString()
  event!: string;

  /**
   * Unique request identifier for idempotency handling.
   * Used to prevent duplicate processing of the same event.
   */
  @IsString()
  @IsOptional()
  requestId?: string;

  /**
   * The main payload data containing event-specific details.
   * Structure varies based on the event type.
   */
  @IsObject()
  @IsOptional()
  data?: Record<string, unknown>;

  /**
   * Raw payload object for flexible webhook handling.
   * Allows forward compatibility with undocumented fields.
   */
  @IsObject()
  @IsOptional()
  raw?: Record<string, unknown>;
}