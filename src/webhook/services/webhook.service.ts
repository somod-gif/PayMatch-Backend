import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NombaWebhookPayloadDto } from '../dto/nomba-webhook-payload.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processWebhook(
    payload: NombaWebhookPayloadDto,
    headers: Record<string, string>,
  ): Promise<{ received: boolean; message: string }> {
    this.logger.log(`Webhook received - Event: ${payload.event}, RequestId: ${payload.requestId}`);

    let webhookEventId: string | undefined;

    try {
      if (payload.requestId) {
        try {
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
        } catch (error) {
          this.logger.warn(`Could not check idempotency: ${(error as Error).message}`);
        }
      }

      try {
        const webhookEvent = await this.prisma.webhookEvent.create({
          data: {
            requestId: payload.requestId || `${Date.now()}-${Math.random()}`,
            eventType: payload.event,
            status: 'received',
            payload: payload as any,
          } as any,
        });
        webhookEventId = webhookEvent.id;
      } catch (error) {
        this.logger.warn(`Could not save webhook event to database: ${(error as Error).message}`);
      }

      switch (payload.event) {
        case 'payment.success':
          await this.handlePaymentSuccess(payload.data);
          break;
        case 'virtual_account.funding':
          await this.handleVirtualAccountFunding(payload.data);
          break;
        case 'transfer.success':
          await this.handleTransferSuccess(payload.data);
          break;
        case 'transfer.failed':
          await this.handleTransferFailed(payload.data);
          break;
        default:
          this.logger.warn(`Unknown event type: ${payload.event}`);
      }

      if (webhookEventId) {
        try {
          await this.prisma.webhookEvent.update({
            where: { id: webhookEventId },
            data: {
              status: 'processed',
              processedAt: new Date(),
            } as any,
          });
        } catch (error) {
          this.logger.warn(`Could not update webhook event status: ${(error as Error).message}`);
        }
      }

      return {
        received: true,
        message: 'Webhook processed successfully.',
      };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${(error as Error).message}`, (error as Error).stack);

      if (webhookEventId) {
        try {
          await this.prisma.webhookEvent.update({
            where: { id: webhookEventId },
            data: {
              status: 'failed',
              error: (error as Error).message,
            } as any,
          });
        } catch (updateError) {
          this.logger.warn(`Could not update webhook event status: ${(updateError as Error).message}`);
        }
      }

      return {
        received: true,
        message: 'Webhook received but processing failed.',
      };
    }
  }

  private async handlePaymentSuccess(data: any) {
    this.logger.log(`Processing payment success: ${JSON.stringify(data)}`);

    try {
      const { reference, amount, invoiceNumber, customerEmail } = data;

      const invoice = await this.prisma.invoice.findFirst({
        where: { invoiceNumber: invoiceNumber } as any,
        include: { customer: true },
      });

      if (!invoice) {
        this.logger.warn(`Invoice not found: ${invoiceNumber}`);
        return;
      }

      const existingPayment = await this.prisma.payment.findFirst({
        where: { merchantTxRef: reference },
      } as any);

      if (existingPayment) {
        this.logger.log(`Payment already recorded: ${reference}`);
        return;
      }

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
    } catch (error) {
      this.logger.error(`Error in handlePaymentSuccess: ${(error as Error).message}`, (error as Error).stack);
    }
  }

  private async handleVirtualAccountFunding(data: any) {
    this.logger.log(`Processing virtual account funding: ${JSON.stringify(data)}`);
  }

  private async handleTransferSuccess(data: any) {
    this.logger.log(`Processing transfer success: ${JSON.stringify(data)}`);
  }

  private async handleTransferFailed(data: any) {
    this.logger.log(`Processing transfer failed: ${JSON.stringify(data)}`);
  }
}