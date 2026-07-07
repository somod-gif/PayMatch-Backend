import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { NombaAuthService } from './nomba-auth.service';
import {
  NombaVirtualAccountRequest,
  NombaVirtualAccountResponse,
} from '../interfaces/nomba.interface';

/**
 * Nomba Virtual Account service.
 * Creates and manages virtual accounts for customer payments.
 *
 * API Endpoint: POST /virtual-accounts
 * Headers:
 *   - Authorization: Bearer {access_token}
 *   - accountId: {NOMBA_ACCOUNT_ID}
 *   - Content-Type: application/json
 *
 * Request Body:
 *   - customer_email: string (required)
 *   - customer_name: string (required)
 *   - phone: string (optional)
 *   - preferred_bank: string (optional)
 *   - sub_account_id: string (optional)
 */
@Injectable()
export class NombaVirtualAccountService {
  private readonly logger = new Logger(NombaVirtualAccountService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: NombaAuthService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>('nomba.baseUrl', 'https://api.nomba.com/v1');
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
    const subAccountId = this.configService.get<string>('nomba.subAccountId');

    this.logger.log(`Creating virtual account for: ${request.customerEmail}`);

    if (!accountId) {
      throw new HttpException(
        { success: false, message: 'Nomba account ID not configured. Set NOMBA_ACCOUNT_ID in .env' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const url = `${this.baseUrl}/virtual-accounts`;

      // Build request payload matching Nomba API specification
      const payload: Record<string, any> = {
        customer_email: request.customerEmail,
        customer_name: request.customerName,
      };

      // Add optional fields if provided
      if (request.phone) {
        payload.phone = request.phone;
      }
      if (request.preferredBank) {
        payload.preferred_bank = request.preferredBank;
      }
      if (subAccountId) {
        payload.sub_account_id = subAccountId;
      }
      if (request.invoiceReference) {
        payload.reference = request.invoiceReference;
      }

      this.logger.log(`Nomba VA request payload: ${JSON.stringify(payload)}`);

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

      this.logger.log(`Nomba VA response status: ${response.status}`);
      this.logger.log(`Nomba VA response body: ${JSON.stringify(response.data)}`);

      // Parse response - Nomba may return data in different formats
      const data = response.data?.data || response.data;

      if (!data) {
        this.logger.error(`Nomba VA response missing data: ${JSON.stringify(response.data)}`);
        throw new HttpException(
          { success: false, message: 'Virtual account creation failed - invalid response from Nomba' },
          HttpStatus.BAD_GATEWAY,
        );
      }

      return {
        accountName: data.account_name || data.accountName || '',
        accountNumber: data.account_number || data.accountNumber || '',
        bankName: data.bank_name || data.bankName || 'Wema Bank',
        providerReference: data.reference || data.providerReference || `VA-${Date.now()}`,
        bankCode: data.bank_code || data.bankCode,
        reservedAmount: data.reserved_amount || data.reservedAmount,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      const status = error?.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      const errorData = error?.response?.data;

      // Log the full Nomba error response
      if (errorData) {
        this.logger.error(`Nomba VA error response: ${JSON.stringify(errorData)}`);
      }

      // Extract the exact error message from Nomba
      const errorMessage = errorData?.message
        || errorData?.error
        || errorData?.error_description
        || error?.message
        || 'Unknown error during virtual account creation';

      this.logger.error(`Nomba virtual account creation failed: ${errorMessage}`);

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

    this.logger.log(`Fetching virtual account: ${accountNumber}`);

    try {
      const url = `${this.baseUrl}/virtual-accounts/${accountNumber}`;

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
        accountName: data.account_name || data.accountName || '',
        accountNumber: data.account_number || data.accountNumber || accountNumber,
        bankName: data.bank_name || data.bankName || 'Wema Bank',
        providerReference: data.reference || data.providerReference || '',
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

      this.logger.error(`Failed to fetch virtual account ${accountNumber}: ${errorMessage}`);
      throw new HttpException(
        { success: false, message: `Failed to fetch virtual account: ${errorMessage}` },
        error?.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}