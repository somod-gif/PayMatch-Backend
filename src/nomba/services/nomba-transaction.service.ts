import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NombaAuthService } from './nomba-auth.service';
import {
  NombaTransactionRequest,
  NombaTransactionResponse,
  NombaTransferRequest,
  NombaTransferResponse,
} from '../interfaces/nomba.interface';

/**
 * Reusable service for Nomba Transaction operations.
 * Handles payment initiation, transfer processing, and transaction queries.
 *
 * TODO: Implement actual HTTP calls to Nomba Transaction API
 * - Initiate payment
 * - Process transfers
 * - Query transaction status
 * - Handle transaction callbacks
 */
@Injectable()
export class NombaTransactionService {
  private readonly logger = new Logger(NombaTransactionService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: NombaAuthService,
  ) {}

  /**
   * Initiates a payment transaction.
   * Placeholder implementation returning demo data.
   */
  async initiatePayment(request: NombaTransactionRequest): Promise<NombaTransactionResponse> {
    const token = await this.authService.getAccessToken();
    this.logger.log(`Initiating payment: ${request.reference}`);

    // TODO: Implement actual API call
    this.logger.warn('Payment initiation not yet implemented - using placeholder');

    return {
      status: 'pending',
      reference: request.reference,
      providerReference: `TXN-${Date.now()}`,
      amount: request.amount,
      currency: request.currency,
      paymentUrl: `https://pay.nomba.com/pay/${request.reference}`,
    };
  }

  /**
   * Processes a transfer to a bank account.
   * Placeholder implementation returning demo data.
   */
  async processTransfer(request: NombaTransferRequest): Promise<NombaTransferResponse> {
    const token = await this.authService.getAccessToken();
    this.logger.log(`Processing transfer: ${request.reference}`);

    // TODO: Implement actual API call
    this.logger.warn('Transfer processing not yet implemented - using placeholder');

    return {
      status: 'pending',
      reference: request.reference,
      providerReference: `TRF-${Date.now()}`,
      amount: request.amount,
      currency: request.currency,
    };
  }

  /**
   * Queries the status of a transaction.
   * Placeholder - implement after Stage 1.
   */
  async queryTransactionStatus(reference: string): Promise<NombaTransactionResponse | null> {
    this.logger.log(`Querying transaction: ${reference}`);

    // TODO: Implement actual API call
    return null;
  }
}