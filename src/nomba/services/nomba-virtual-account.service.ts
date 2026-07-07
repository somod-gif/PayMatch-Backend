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
   * API Endpoint: POST {baseUrl}/v1/accounts/virtual/{subAccountId}
   * Headers:
   *   - Authorization: Bearer {access_token}
   *   - accountId: {NOMBA_ACCOUNT_ID} (Parent Account ID)
   *   - Content-Type: application/json
   *
   * Virtual accounts are provisioned under the SUB ACCOUNT, not the parent account.
   * The subAccountId is passed as a path parameter.
   *
   * Request Body:
   *   - customer_email: string (required)
   *   - customer_name: string (required)
   *   - account_name: string (required)
   *   - phone: string (optional)
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
    const subAccountId = this.configService.get<string>('nomba.subAccountId');

    this.logger.log(`[Nomba VA] Creating virtual account for: ${request.customerEmail}`);

    if (!accountId) {
      throw new HttpException(
        { success: false, message: 'Nomba account ID not configured. Set NOMBA_ACCOUNT_ID in .env' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!subAccountId) {
      throw new HttpException(
        { success: false, message: 'Nomba sub account ID not configured. Set NOMBA_SUB_ACCOUNT_ID in .env' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // Virtual accounts are created under the sub-account
      // POST /v1/accounts/virtual/{subAccountId}
      const url = `${this.baseUrl}/v1/accounts/virtual/${subAccountId}`;
      this.logger.log(`[Nomba VA] POST ${url}`);

      // Build request payload matching Nomba API specification
      const payload: Record<string, any> = {
        customer_email: request.customerEmail,
        customer_name: request.customerName,
        account_name: request.customerName,
      };

      // Add optional fields if provided
      if (request.phone) {
        payload.phone = request.phone;
      }
      if (request.invoiceReference) {
        payload.reference = request.invoiceReference;
      }

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

      // Log response body in development only
      if (!this.isProduction) {
        this.logger.log(`[Nomba VA] Response body: ${JSON.stringify(response.data)}`);
      }

      // Nomba API returns 200 even for validation errors, with error in response body
      // Check for Nomba-specific error indicators
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
        throw new HttpException(
          { success: false, message: `Virtual account creation failed: ${errorMessage}`, nombaError: responseData },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Parse response - Nomba may return data in different formats
      const data = response.data?.data || response.data;

      if (!data) {
        this.logger.error(`[Nomba VA] Response missing data: ${JSON.stringify(response.data)}`);
        throw new HttpException(
          { success: false, message: 'Virtual account creation failed - invalid response from Nomba' },
          HttpStatus.BAD_GATEWAY,
        );
      }
      
      // Validate required fields from Nomba response
      if (!data.account_name && !data.accountNumber && !data.account_number) {
        this.logger.error(`[Nomba VA] Missing account number in response: ${JSON.stringify(data)}`);
        throw new HttpException(
          { success: false, message: 'Virtual account creation failed - no account number returned from Nomba' },
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
        this.logger.error(`[Nomba VA] Error response: ${JSON.stringify(errorData)}`);
      }

      // Extract the exact error message from Nomba
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

      this.logger.error(`[Nomba VA] Failed to fetch virtual account ${accountNumber}: ${errorMessage}`);
      throw new HttpException(
        { success: false, message: `Failed to fetch virtual account: ${errorMessage}` },
        error?.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}