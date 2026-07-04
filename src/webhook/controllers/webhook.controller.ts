import { Controller, Post, Body, Headers, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { WebhookService } from '../services/webhook.service';
import { NombaWebhookPayloadDto } from '../dto/nomba-webhook-payload.dto';

/**
 * Controller responsible for handling incoming Nomba webhook requests.
 *
 * All webhook endpoints are prefixed with /webhooks.
 * Business logic is delegated to WebhookService.
 */
@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly webhookService: WebhookService) {}

  /**
   * POST /webhooks/nomba
   *
   * Receives webhook events from Nomba.
   * Logs request details for debugging and audit purposes.
   * Returns HTTP 200 immediately to acknowledge receipt.
   *
   * @param payload - The validated webhook payload
   * @param headers - The raw request headers (used for signature verification in future)
   * @returns Acknowledgment response
   */
  @Post('nomba')
  @ApiOperation({ 
    summary: 'Receive Nomba webhook events',
    description: 'Endpoint for receiving webhook events from Nomba. Used for payment notifications, virtual account funding, and transfer events.'
  })
  @ApiHeader({ 
    name: 'x-nomba-signature', 
    description: 'HMAC SHA-256 signature for webhook verification',
    required: false 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook received and processed successfully',
    schema: {
      example: {
        received: true,
        message: 'Webhook processed successfully.'
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Duplicate webhook ignored',
    schema: {
      example: {
        received: true,
        message: 'Webhook already processed.'
      }
    }
  })
  async handleNombaWebhook(
    @Body() payload: NombaWebhookPayloadDto,
    @Headers() headers: Record<string, string>,
  ): Promise<{ received: boolean; message: string }> {
    this.logger.log(
      `Incoming webhook - Method: POST, URL: /webhooks/nomba, Event: ${payload.event}`,
    );

    // NOTE: Sensitive headers (e.g., authorization) are excluded from logs
    const safeHeaders = { ...headers };
    delete safeHeaders['authorization'];
    delete safeHeaders['x-nomba-private-key'];
    this.logger.debug(`Request headers: ${JSON.stringify(safeHeaders, null, 2)}`);
    this.logger.debug(`Request body: ${JSON.stringify(payload, null, 2)}`);

    return this.webhookService.processWebhook(payload, headers);
  }
}
