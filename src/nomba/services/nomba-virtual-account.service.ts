import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NombaAuthService } from './nomba-auth.service';
import {
  NombaVirtualAccountRequest,
  NombaVirtualAccountResponse,
} from '../interfaces/nomba.interface';

/**
 * Reusable service for Nomba Virtual Account operations.
 * Handles creation and management of virtual accounts for customers.
 *
 * TODO: Implement actual HTTP calls to Nomba Virtual Account API
 * - Create virtual account via Nomba API
 * - Assign virtual account to customer
 * - Query virtual account balance
 * - Deactivate virtual account
 */
@Injectable()
export class NombaVirtualAccountService {
  private readonly logger = new Logger(NombaVirtualAccountService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly authService: NombaAuthService,
  ) {}

  /**
   * Creates a virtual account for a customer.
   * Placeholder implementation returning demo data.
   */
  async createVirtualAccount(
    request: NombaVirtualAccountRequest,
  ): Promise<NombaVirtualAccountResponse> {
    const token = await this.authService.getAccessToken();
    this.logger.log(`Creating virtual account for: ${request.customerEmail}`);

    // TODO: Implement actual API call
    // const response = await this.httpService.post(
    //   '/virtual-accounts',
    //   {
    //     customer_id: request.customerId,
    //     customer_email: request.customerEmail,
    //     customer_name: request.customerName,
    //     phone: request.phone,
    //     preferred_bank: request.preferredBank,
    //   },
    //   { headers: { Authorization: `Bearer ${token}` } },
    // ).toPromise();

    this.logger.warn('Virtual account creation not yet implemented - using placeholder');

    return {
      accountName: `${request.customerName.toUpperCase()}-PAYMATCH`,
      accountNumber: '1234567890',
      bankName: 'Wema Bank',
      providerReference: `VA-${Date.now()}`,
    };
  }

  /**
   * Retrieves virtual account details.
   * Placeholder - implement after Stage 1.
   */
  async getVirtualAccount(accountNumber: string): Promise<NombaVirtualAccountResponse | null> {
    this.logger.log(`Fetching virtual account: ${accountNumber}`);

    // TODO: Implement actual API call
    return null;
  }
}