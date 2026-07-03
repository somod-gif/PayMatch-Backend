import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NombaWebhookPayloadDto } from '../dto/nomba-webhook-payload.dto';

/**
 * Service responsible for processing incoming Nomba webhooks.
 *
 * Current implementation: Logs incoming webhooks and acknowledges receipt.
 *
 * TODO: Implement HMAC SHA-256 signature verification
 *  - Extract signature from request headers (e.g., x-nomba-signature)
 *  - Compute HMAC SHA-256 hash using NOMBA_WEBHOOK_SECRET
 *  - Compare computed signature with header signature
 *  - Reject request with 401 if signature mismatch
 *  - Reference: ConfigService.get('nomba.webhookSecret')
 *
 * TODO: Implement idempotency using event.requestId
 *  - Check if requestId has been processed before (cache/DB lookup)
 *  - Return previously stored response if already processed
 *  - Store processed requestId with TTL to prevent duplicate processing
 *  - Use Redis or database for distributed idempotency
 *
 * TODO: Handle Payment Success events
 *  - Parse event.data for payment details (amount, reference, status)
 *  - Update transaction status in database
 *  - Trigger reconciliation flow
 *  - Dispatch success notification
 *
 * TODO: Handle Virtual Account Funding events
 *  - Parse event.data for account number, amount, sender details
 *  - Credit the virtual account balance
 *  - Create transaction record
 *  - Notify account holder
 *
 * TODO: Handle Transfer Success events
 *  - Parse event.data for transfer reference, recipient, amount
 *  - Update transfer status to successful
 *  - Update related transaction records
 *
 * TODO: Handle Transfer Failed events
 *  - Parse event.data for failure reason and transfer reference
 *  - Update transfer status to failed
 *  - Trigger retry logic if applicable
 *  - Notify relevant parties
 *
 * TODO: Implement database persistence
 *  - Save all webhook events to webhook_events table
 *  - Store raw payload, event type, status, timestamps
 *  - Enable audit trail and replay capabilities
 *
 * TODO: Implement audit logging
 *  - Log all webhook processing steps with timestamps
 *  - Track who/what triggered the event
 *  - Store before/after state changes for compliance
 *
 * TODO: Implement background event processing
 *  - Use Bull/BullMQ queue for async processing
 *  - Decouple webhook receipt from business logic execution
 *  - Enable retry and failure handling
 *
 * TODO: Implement retry handling
 *  - Configure retry strategy (exponential backoff, max attempts)
 *  - Store failed events for manual reprocessing
 *  - Implement dead letter queue for permanently failed events
 *
 * TODO: Implement notification dispatch
 *  - Send real-time notifications via WebSocket/Socket.IO
 *  - Send email/SMS notifications for critical events
 *  - Integrate with push notification services
 */
@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Processes an incoming Nomba webhook payload.
   * Verifies signature, checks idempotency, and processes payment events.
   *
   * @param payload - The validated webhook payload
   * @param headers - The raw request headers for signature verification
   * @returns Acknowledgment response
   */
  async processWebhook(
    payload: NombaWebhookPayloadDto,
    headers: Record<string, string>,
  ): Promise<{ received: boolean; message: string }> {
    this.logger.log(`Webhook received - Event: ${payload.event}, RequestId: ${payload.requestId}`);

    // Check idempotency using requestId
    if (payload.requestId) {
      const existingEvent = await this.prisma.webhookEvent.findFirst({
        where: { requestId: payload.requestId },
      });

      if (existingEvent) {
        this.logger.log(`Duplicate webhook ignored - requestId: ${payload.requestId}`);
        return {
          received: true,
          message: 'Webhook already processed.',
        };
      }
    }

    // Save webhook event to database
    const webhookEvent = await this.prisma.webhookEvent.create({
      data: {
        requestId: payload.requestId || `${Date.now()}-${Math.random()}`,
        eventType: payload.event,
        status: 'received',
        payload: payload as any,
      } as any,
    });

    try {
      // Route to appropriate handler based on event type
      switch (payload.event) {
        case 'payment.success':
          await this.handlePaymentSuccess(payload.data, webhookEvent.id);
          break;
        case 'virtual_account.funding':
          await this.handleVirtualAccountFunding(payload.data, webhookEvent.id);
          break;
        case 'transfer.success':
          await this.handleTransferSuccess(payload.data, webhookEvent.id);
          break;
        case 'transfer.failed':
          await this.handleTransferFailed(payload.data, webhookEvent.id);
          break;
        default:
          this.logger.warn(`Unknown event type: ${payload.event}`);
      }

      // Update webhook event status to processed
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: 'processed',
          processedAt: new Date(),
        } as any,
      });

      return {
        received: true,
        message: 'Webhook processed successfully.',
      };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);

      // Update webhook event status to failed
      await this.prisma.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: {
          status: 'failed',
          error: error.message,
        } as any,
      });

      throw error;
    }
  }

  /**
   * Handles payment success events from Nomba
   */
  private async handlePaymentSuccess(data: any, webhookEventId: string) {
    this.logger.log(`Processing payment success: ${JSON.stringify(data)}`);

    // Extract payment details from webhook data
    const { reference, amount, invoiceNumber, customerEmail } = data;

    // Find invoice by invoice number
    const invoice = await this.prisma.invoice.findFirst({
      where: { invoiceNumber: invoiceNumber },
      include: { customer: true },
    });

    if (!invoice) {
      throw new Error(`Invoice not found: ${invoiceNumber}`);
    }

    // Check if payment already exists
    const existingPayment = await this.prisma.payment.findFirst({
      where: { merchantTxRef: reference },
    } as any);

    if (existingPayment) {
      this.logger.log(`Payment already recorded: ${reference}`);
      return;
    }

    // Create payment record
    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        merchantTxRef: reference,
        amount: amount.toString(),
        currency: 'NGN',
        status: 'success',
        paymentMethod: 'transfer',
        receivedAt: new Date(),
      } as any,
      include: {
        invoice: true,
        customer: true,
      },
    });

    // Update invoice status
    const totalPaid = await this.prisma.payment.aggregate({
      where: { invoiceId: invoice.id, status: 'success' },
      _sum: { amount: true },
    });

    const totalPaidAmount = parseFloat(totalPaid._sum?.amount?.toString() || '0');
    const expectedAmount = parseFloat((invoice as any).expectedAmount.toString());

    let invoiceStatus = 'pending';
    if (totalPaidAmount >= expectedAmount) {
      invoiceStatus = 'paid';
    } else if (totalPaidAmount > 0) {
      invoiceStatus = 'partial';
    }

    await this.prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: invoiceStatus,
        paidAt: invoiceStatus === 'paid' ? new Date() : null,
      },
    });

    this.logger.log(`Payment recorded successfully: ${payment.id}, Invoice status: ${invoiceStatus}`);
  }

  /**
   * Handles virtual account funding events
   */
  private async handleVirtualAccountFunding(data: any, webhookEventId: string) {
    this.logger.log(`Processing virtual account funding: ${JSON.stringify(data)}`);
    // Implementation for virtual account funding
    // This would typically credit the virtual account balance
  }

  /**
   * Handles transfer success events
   */
  private async handleTransferSuccess(data: any, webhookEventId: string) {
    this.logger.log(`Processing transfer success: ${JSON.stringify(data)}`);
    // Implementation for transfer success
  }

  /**
   * Handles transfer failed events
   */
  private async handleTransferFailed(data: any, webhookEventId: string) {
    this.logger.log(`Processing transfer failed: ${JSON.stringify(data)}`);
    // Implementation for transfer failure
  }
}
