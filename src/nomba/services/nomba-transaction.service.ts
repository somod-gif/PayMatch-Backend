import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { NombaAuthService } from './nomba-auth.service';
import {
  NombaTransactionRequest,
  NombaTransactionResponse,
  NombaTransferRequest,
  NombaTransferResponse,
} from '../interfaces/nomba.interface';

/**
 * Nomba Transaction service.
 * Handles payment initiation, transfer processing, and transaction queries.
 *
 * API Endpoints:
 *   - POST {baseUrl}/transactions/payment
 *   - POST {baseUrl}/transfers
 *   - GET {baseUrl}/transactions/{reference}
 *
 * Headers:
 *   - Authorization: Bearer {access_token}
 *   - accountId: {NOMBA_ACCOUNT_ID}
 *   - Content-Type: application/json
 */
@Injectable()
export class NombaTransactionService {
  private readonly logger = new Logger(NombaTransactionService.name);
  private readonly baseUrl: string;
  private readonly isProduction: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: NombaAuthService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>('nomba.baseUrl', 'https://sandbox.nomba.com');
    this.isProduction = this.baseUrl.includes('api.nomba.com');
  }

  /**
   * Initiates a payment transaction via Nomba API.
   * Creates a payment request that the customer can complete.
   */
  async initiatePayment(request: NombaTransactionRequest): Promise<NombaTransactionResponse> {
    const token = await this.authService.getAccessToken();
    const accountId = this.configService.get<string>('nomba.accountId');

    this.logger.log(`[Nomba TXN] Initiating payment: ${request.reference}`);

    if (!accountId) {
      throw new HttpException(
        { success: false, message: 'Nomba account ID not configured' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const url = `${this.baseUrl}/transactions/payment`;
      this.logger.log(`[Nomba TXN] POST ${url}`);

      const payload = {
        amount: request.amount,
        currency: request.currency || 'NGN',
        reference: request.reference,
        customer_email: request.customerEmail,
        customer_name: request.customerName,
        description: request.description || 'Payment',
        callback_url: request.callbackUrl,
      };

      this.logger.log(`[Nomba TXN] Request payload: ${JSON.stringify(payload)}`);

      const response = await lastValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accountId': accountId,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }),
      );

      this.logger.log(`[Nomba TXN] Response status: ${response.status}`);

      if (!this.isProduction) {
        this.logger.log(`[Nomba TXN] Response body: ${JSON.stringify(response.data)}`);
      }

      const data = response.data?.data || response.data;

      return {
        status: data.status || 'pending',
        reference: data.reference || request.reference,
        providerReference: data.provider_reference || data.providerReference || `TXN-${Date.now()}`,
        amount: data.amount || request.amount,
        currency: data.currency || request.currency,
        paymentUrl: data.payment_url || data.paymentUrl || data.checkout_url,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errorData = error?.response?.data;
      const status = error?.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;

      if (errorData) {
        this.logger.error(`[Nomba TXN] Error response: ${JSON.stringify(errorData)}`);
      }

      const errorMessage = errorData?.message
        || errorData?.error
        || error?.message
        || 'Unknown error initiating payment';

      this.logger.error(`[Nomba TXN] Payment initiation failed: ${errorMessage}`);

      throw new HttpException(
        { success: false, message: `Payment initiation failed: ${errorMessage}` },
        status,
      );
    }
  }

  /**
   * Processes a transfer to a bank account.
   */
  async processTransfer(request: NombaTransferRequest): Promise<NombaTransferResponse> {
    const token = await this.authService.getAccessToken();
    const accountId = this.configService.get<string>('nomba.accountId');

    this.logger.log(`[Nomba TRF] Processing transfer: ${request.reference}`);

    if (!accountId) {
      throw new HttpException(
        { success: false, message: 'Nomba account ID not configured' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const url = `${this.baseUrl}/transfers`;
      this.logger.log(`[Nomba TRF] POST ${url}`);

      const payload = {
        amount: request.amount,
        currency: request.currency || 'NGN',
        reference: request.reference,
        recipient_account: request.recipientAccount,
        recipient_bank: request.recipientBank,
        recipient_name: request.recipientName,
        narration: request.narration || 'Transfer',
      };

      this.logger.log(`[Nomba TRF] Request payload: ${JSON.stringify(payload)}`);

      const response = await lastValueFrom(
        this.httpService.post(url, payload, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accountId': accountId,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }),
      );

      this.logger.log(`[Nomba TRF] Response status: ${response.status}`);

      const data = response.data?.data || response.data;

      return {
        status: data.status || 'pending',
        reference: data.reference || request.reference,
        providerReference: data.provider_reference || data.providerReference || `TRF-${Date.now()}`,
        amount: data.amount || request.amount,
        currency: data.currency || request.currency,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      const errorData = error?.response?.data;
      const status = error?.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;

      if (errorData) {
        this.logger.error(`[Nomba TRF] Error response: ${JSON.stringify(errorData)}`);
      }

      const errorMessage = errorData?.message
        || errorData?.error
        || error?.message
        || 'Unknown error processing transfer';

      this.logger.error(`[Nomba TRF] Transfer processing failed: ${errorMessage}`);

      throw new HttpException(
        { success: false, message: `Transfer failed: ${errorMessage}` },
        status,
      );
    }
  }

  /**
   * Queries the status of a transaction.
   */
  async queryTransactionStatus(reference: string): Promise<NombaTransactionResponse | null> {
    const token = await this.authService.getAccessToken();
    const accountId = this.configService.get<string>('nomba.accountId');

    this.logger.log(`[Nomba TXN] Querying transaction: ${reference}`);

    try {
      const url = `${this.baseUrl}/transactions/${reference}`;
      this.logger.log(`[Nomba TXN] GET ${url}`);

      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accountId': accountId,
            'Accept': 'application/json',
          },
        }),
      );

      this.logger.log(`[Nomba TXN] Response status: ${response.status}`);

      const data = response.data?.data || response.data;

      if (!data) {
        return null;
      }

      return {
        status: data.status || 'unknown',
        reference: data.reference || reference,
        providerReference: data.provider_reference || data.providerReference || '',
        amount: data.amount || 0,
        currency: data.currency || 'NGN',
        paymentUrl: data.payment_url || data.paymentUrl,
      };
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }

      const errorMessage = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || 'Unknown error querying transaction';

      this.logger.error(`[Nomba TXN] Transaction query failed: ${errorMessage}`);
      throw new HttpException(
        { success: false, message: `Transaction query failed: ${errorMessage}` },
        error?.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}