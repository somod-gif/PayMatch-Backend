import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';
import { NombaAuthService } from './nomba-auth.service';
import {
  NombaVirtualAccountRequest,
  NombaVirtualAccountResponse,
} from '../interfaces/nomba.interface';

  /**
   * Nomba Virtual Account service.
   * Creates and manages virtual accounts for customer payments.
   *
    * API Endpoint: POST {baseUrl}/v1/accounts/virtual
   * Headers:
   *   - Authorization: Bearer {access_token}
    *   - accountId: {PARENT_ACCOUNT_ID}
   *   - Content-Type: application/json
   *
   * Request Body:
    *   - accountRef: string (required)
    *   - accountName: string (required)
    *   - expectedAmount: number (required)
   */
@Injectable()
export class NombaVirtualAccountService {
  private readonly logger = new Logger(NombaVirtualAccountService.name);
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
   * Creates a virtual account for a customer via Nomba API.
   * Returns the virtual account details including account number and bank name.
   */
  async createVirtualAccount(
    request: NombaVirtualAccountRequest,
  ): Promise<NombaVirtualAccountResponse> {
    const token = await this.authService.getAccessToken();
    const accountId = this.configService.get<string>('nomba.accountId');
    const accountRef = request.accountRef || randomUUID();

    this.logger.log(`[Nomba VA] Creating virtual account for reference: ${accountRef}`);

    if (!accountId) {
      throw new HttpException(
        { success: false, message: 'Nomba account ID not configured. Set NOMBA_ACCOUNT_ID in .env' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const url = `${this.baseUrl}/v1/accounts/virtual`;
      this.logger.log(`[Nomba VA] POST ${url}`);

      const payload = {
        accountRef,
        accountName: request.accountName,
        expectedAmount: request.expectedAmount,
      };

      this.logger.log(`[Nomba VA] Request payload: ${JSON.stringify(payload)}`);

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

      this.logger.log(`[Nomba VA] Response status: ${response.status}`);

      if (!this.isProduction) {
        this.logger.log(`[Nomba VA] Response body: ${JSON.stringify(response.data)}`);
      }

      const responseData = response.data;
      const isNombaError = responseData?.status === false 
        || responseData?.code === '400' 
        || responseData?.code === 400
        || (responseData?.data?.status === false)
        || (responseData?.data?.code === '400')
        || (responseData?.data?.code === 400);
      
      if (isNombaError) {
        const errorMessage = responseData?.message 
          || responseData?.description 
          || responseData?.data?.message 
          || responseData?.data?.description 
          || 'Validation error from Nomba';
        this.logger.error(`[Nomba VA] Nomba API error: ${errorMessage}`);
        this.logger.error(`[Nomba VA] Request URL: ${url}`);
        this.logger.error(`[Nomba VA] Headers: ${JSON.stringify(this.redactedHeaders(token, accountId))}`);
        this.logger.error(`[Nomba VA] Payload: ${JSON.stringify(payload)}`);
        this.logger.error(`[Nomba VA] Status Code: ${response.status}`);
        this.logger.error(`[Nomba VA] Response Body: ${JSON.stringify(responseData)}`);
        throw new HttpException(
          { success: false, message: `Virtual account creation failed: ${errorMessage}`, nombaError: responseData },
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = response.data?.data || response.data;

      if (!data) {
        this.logger.error(`[Nomba VA] Response missing data: ${JSON.stringify(response.data)}`);
        throw new HttpException(
          { success: false, message: 'Virtual account creation failed - invalid response from Nomba' },
          HttpStatus.BAD_GATEWAY,
        );
      }
      
      if (!data.bankName && !data.bank_name) {
        this.logger.error(`[Nomba VA] Missing bank name in response: ${JSON.stringify(data)}`);
        throw new HttpException(
          { success: false, message: 'Virtual account creation failed - no bank name returned from Nomba' },
          HttpStatus.BAD_GATEWAY,
        );
      }

      if (!data.bankAccountNumber && !data.bank_account_number && !data.accountNumber && !data.account_number) {
        this.logger.error(`[Nomba VA] Missing account number in response: ${JSON.stringify(data)}`);
        throw new HttpException(
          { success: false, message: 'Virtual account creation failed - no account number returned from Nomba' },
          HttpStatus.BAD_GATEWAY,
        );
      }

      const amount = Number(
        data.expectedAmount
        ?? data.expected_amount
        ?? data.amount
        ?? request.expectedAmount,
      );

      return {
        accountRef: data.accountRef || data.account_ref || data.reference || accountRef,
        accountName: data.bankAccountName || data.bank_account_name || data.accountName || data.account_name || request.accountName,
        accountNumber: data.bankAccountNumber || data.bank_account_number || data.accountNumber || data.account_number || '',
        bankName: data.bankName || data.bank_name || 'Wema Bank',
        amount: Number.isFinite(amount) ? amount : request.expectedAmount,
        currency: data.currency || data.Currency || 'NGN',
        paymentStatus: 'PENDING',
        bankCode: data.bank_code || data.bankCode,
        reservedAmount: data.reserved_amount || data.reservedAmount,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      const status = error?.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      const errorData = error?.response?.data;

      this.logger.error(`[Nomba VA] Request URL: ${this.baseUrl}/v1/accounts/virtual`);
      this.logger.error(`[Nomba VA] Headers: ${JSON.stringify(this.redactedHeaders(token, accountId))}`);
      this.logger.error(`[Nomba VA] Payload: ${JSON.stringify({
        accountRef,
        accountName: request.accountName,
        expectedAmount: request.expectedAmount,
      })}`);

      if (errorData) {
        this.logger.error(`[Nomba VA] Error response: ${JSON.stringify(errorData)}`);
      }

      this.logger.error(`[Nomba VA] Status Code: ${status}`);

      const errorMessage = errorData?.message
        || errorData?.error
        || errorData?.error_description
        || error?.message
        || 'Unknown error during virtual account creation';

      this.logger.error(`[Nomba VA] Virtual account creation failed: ${errorMessage}`);

      // Return the real Nomba error instead of generic message
      throw new HttpException(
        {
          success: false,
          message: `Virtual account creation failed: ${errorMessage}`,
          ...(errorData ? { nombaError: errorData } : {}),
        },
        status,
      );
    }
  }

  /**
   * Retrieves virtual account details by account number.
   */
  async getVirtualAccount(accountNumber: string): Promise<NombaVirtualAccountResponse | null> {
    const token = await this.authService.getAccessToken();
    const accountId = this.configService.get<string>('nomba.accountId');
    const subAccountId = this.configService.get<string>('nomba.subAccountId');

    this.logger.log(`[Nomba VA] Fetching virtual account: ${accountNumber}`);

    if (!subAccountId) {
      this.logger.warn('[Nomba VA] No sub account ID configured, cannot fetch virtual account');
      return null;
    }

    try {
      const url = `${this.baseUrl}/v1/accounts/virtual/${subAccountId}/${accountNumber}`;
      this.logger.log(`[Nomba VA] GET ${url}`);

      const response = await lastValueFrom(
        this.httpService.get(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accountId': accountId,
            'Accept': 'application/json',
          },
        }),
      );

      this.logger.log(`[Nomba VA] Response status: ${response.status}`);

      const data = response.data?.data || response.data;

      if (!data) {
        return null;
      }

      const amount = Number(data.expectedAmount ?? data.expected_amount ?? data.amount ?? 0);

      return {
        accountRef: data.accountRef || data.account_ref || data.reference || accountNumber,
        accountName: data.bankAccountName || data.bank_account_name || data.accountName || data.account_name || '',
        accountNumber: data.bankAccountNumber || data.bank_account_number || data.accountNumber || data.account_number || accountNumber,
        bankName: data.bankName || data.bank_name || 'Wema Bank',
        amount: Number.isFinite(amount) ? amount : 0,
        currency: data.currency || 'NGN',
        paymentStatus: 'PENDING',
        bankCode: data.bank_code || data.bankCode,
        reservedAmount: data.reserved_amount || data.reservedAmount,
      };
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }

      const errorMessage = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || 'Unknown error fetching virtual account';

      this.logger.error(`[Nomba VA] Failed to fetch virtual account ${accountNumber}: ${errorMessage}`);
      throw new HttpException(
        { success: false, message: `Failed to fetch virtual account: ${errorMessage}` },
        error?.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private redactedHeaders(token: string, accountId?: string | null) {
    return {
      Authorization: token ? 'Bearer ***' : 'MISSING',
      accountId: accountId ? `***${accountId.slice(-4)}` : 'MISSING',
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }
}