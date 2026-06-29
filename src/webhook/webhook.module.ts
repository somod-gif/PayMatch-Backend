import { Module } from '@nestjs/common';
import { WebhookController } from './controllers/webhook.controller';
import { WebhookService } from './services/webhook.service';

/**
 * Webhook module responsible for receiving and processing incoming webhooks
 * from Nomba and other external services.
 *
 * This module is self-contained and can be extended with:
 * - Additional webhook controllers for other providers
 * - Event-specific handler services
 * - Queue integration for background processing
 */
@Module({
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}