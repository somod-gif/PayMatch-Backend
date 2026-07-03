import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Service responsible for verifying Nomba webhook signatures.
 * Uses HMAC SHA-256 to ensure webhook payloads are authentic.
 */
@Injectable()
export class NombaWebhookVerificationService {
  private readonly logger = new Logger(NombaWebhookVerificationService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Verifies the HMAC SHA-256 signature of a webhook payload.
   *
   * @param payload - The raw webhook payload as a string
   * @param signature - The signature from the x-nomba-signature header
   * @returns true if signature is valid, false otherwise
   */
  verifySignature(payload: string, signature: string): boolean {
    const secret = this.configService.get<string>('nomba.webhookSecret', 'NombaHackathon2026');

    if (!signature) {
      this.logger.warn('Webhook signature missing');
      return false;
    }

    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const isValid = crypto.timingSafeEqual(
      Buffer.from(computedSignature),
      Buffer.from(signature),
    );

    if (!isValid) {
      this.logger.warn('Webhook signature verification failed');
    }

    return isValid;
  }
}