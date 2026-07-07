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
 * API Endpoint: POST /transactions/payment
 * Headers:
 *   - Authorization: Bearer {access_token}
 *   - accountId: {NOMBA_ACCOUNT_ID}
 *   - Content-Type: application/json
 */
@Injectable()
export class NombaTransactionService {
  private readonly logger = new Logger(NombaTransactionService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: NombaAuthService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>('nomba.baseUrl', 'https://api.nomba.com/v1');
  }

  /**
   * Initiates a payment transaction via Nomba API.
   * Creates a payment request that the customer can complete.
   */
  async initiatePayment(request: NombaTransactionRequest): Promise<NombaTransactionResponse> {
    const token = await this.authService.getAccessToken();
    const accountId = this.configService.get<string>('nomba.accountId');

    this.logger.log(`Initiating payment: ${request.reference}`);

    if (!accountId) {
      throw new HttpException(
        { success: false, message: 'Nomba account ID not configured' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const url = `${this.baseUrl}/transactions/payment`;

      const payload = {
        amount: request.amount,
        currency: request.currency || 'NGN',
        reference: request.reference,
        customer_email: request.customerEmail,
        customer_name: request.customerName,
        description: request.description || 'Payment',
        callback_url: request.callbackUrl,
      };

      this.logger.log(`Nomba payment request: ${JSON.stringify(payload)}`);

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

      this.logger.log(`Nomba payment response status: ${response.status}`);
      this.logger.log(`Nomba payment response: ${JSON.stringify(response.data)}`);

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
        this.logger.error(`Nomba payment error: ${JSON.stringify(errorData)}`);
      }

      const errorMessage = errorData?.message
        || errorData?.error
        || error?.message
        || 'Unknown error initiating payment';

      this.logger.error(`Payment initiation failed: ${errorMessage}`);

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

    this.logger.log(`Processing transfer: ${request.reference}`);

    if (!accountId) {
      throw new HttpException(
        { success: false, message: 'Nomba account ID not configured' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const url = `${this.baseUrl}/transfers`;

      const payload = {
        amount: request.amount,
        currency: request.currency || 'NGN',
        reference: request.reference,
        recipient_account: request.recipientAccount,
        recipient_bank: request.recipientBank,
        recipient_name: request.recipientName,
        narration: request.narration || 'Transfer',
      };

      this.logger.log(`Nomba transfer request: ${JSON.stringify(payload)}`);

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
        this.logger.error(`Nomba transfer error: ${JSON.stringify(errorData)}`);
      }

      const errorMessage = errorData?.message
        || errorData?.error
        || error?.message
        || 'Unknown error processing transfer';

      this.logger.error(`Transfer processing failed: ${errorMessage}`);

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

    this.logger.log(`Querying transaction: ${reference}`);

    try {
      const url = `${this.baseUrl}/transactions/${reference}`;

      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accountId': accountId,
            'Accept': 'application/json',
          },
        }),
      );

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

      this.logger.error(`Transaction query failed: ${errorMessage}`);
      throw new HttpException(
        { success: false, message: `Transaction query failed: ${errorMessage}` },
        error?.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}