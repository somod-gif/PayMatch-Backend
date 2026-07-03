import { Module } from '@nestjs/common';
import { WebhookController } from './controllers/webhook.controller';
import { WebhookService } from './services/webhook.service';
import { NombaModule } from '../nomba/nomba.module';

/**
 * Webhook module responsible for receiving and processing incoming webhooks
 * from Nomba and other external services.
 *
 * This module imports NombaModule for webhook signature verification.
 */
@Module({
  imports: [NombaModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}