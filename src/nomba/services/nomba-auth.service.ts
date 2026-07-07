import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { NombaAuthToken } from '../interfaces/nomba.interface';

/**
 * Nomba OAuth authentication service.
 * Handles token acquisition, caching, and automatic refresh.
 *
 * Authentication Flow:
 * 1. POST to Nomba OAuth token endpoint with client_id and private_key
 * 2. Cache the access token in-memory with expiry buffer
 * 3. Return valid token, refreshing automatically when expired
 */
@Injectable()
export class NombaAuthService {
  private readonly logger = new Logger(NombaAuthService.name);
  private cachedToken: NombaAuthToken | null = null;
  private tokenExpiry: Date | null = null;
  private readonly baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>('nomba.baseUrl', 'https://api.nomba.com/v1');
  }

  /**
   * Returns a valid access token, reusing cached token if not expired.
   * Automatically acquires a new token if cached token is expired or missing.
   */
  async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      this.logger.debug('Using cached Nomba access token');
      return this.cachedToken.accessToken;
    }

    this.logger.log('Acquiring new Nomba access token');
    const token = await this.authenticate();
    this.cacheToken(token);
    return token.accessToken;
  }

  /**
   * Authenticates with Nomba API using OAuth client credentials.
   * POST to /auth/token with client_id and private_key.
   */
  private async authenticate(): Promise<NombaAuthToken> {
    const clientId = this.configService.get<string>('nomba.clientId');
    const privateKey = this.configService.get<string>('nomba.privateKey');

    if (!clientId || !privateKey) {
      throw new HttpException(
        {
          success: false,
          message: 'Nomba API credentials not configured. Set NOMBA_CLIENT_ID and NOMBA_PRIVATE_KEY in .env',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      this.logger.log('Requesting Nomba OAuth token...');
      const url = `${this.baseUrl}/auth/token`;

      const response = await lastValueFrom(
        this.httpService.post(url, {
          client_id: clientId,
          private_key: privateKey,
          grant_type: 'client_credentials',
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }),
      );

      this.logger.log(`Nomba OAuth response status: ${response.status}`);

      if (!response.data.access_token) {
        this.logger.error(`Nomba auth response missing access_token: ${JSON.stringify(response.data)}`);
        throw new HttpException(
          { success: false, message: 'Nomba authentication failed - invalid response' },
          HttpStatus.UNAUTHORIZED,
        );
      }

      return {
        accessToken: response.data.access_token,
        expiresIn: response.data.expires_in ?? 3600,
        tokenType: response.data.token_type ?? 'Bearer',
        scope: response.data.scope,
      };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }

      const status = error?.response?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      const errorMessage = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || 'Unknown error during Nomba authentication';

      this.logger.error(`Nomba authentication failed: ${errorMessage}`);

      // Log the full error for debugging
      if (error?.response?.data) {
        this.logger.error(`Nomba auth error details: ${JSON.stringify(error.response.data)}`);
      }

      throw new HttpException(
        { success: false, message: `Nomba authentication failed: ${errorMessage}` },
        status,
      );
    }
  }

  private cacheToken(token: NombaAuthToken): void {
    this.cachedToken = token;
    // Cache for expiresIn minus 5 minutes buffer to ensure token is still valid
    this.tokenExpiry = new Date(Date.now() + (token.expiresIn - 300) * 1000);
    this.logger.log(`Nomba token cached, expires at ${this.tokenExpiry.toISOString()}`);
  }

  invalidateCache(): void {
    this.cachedToken = null;
    this.tokenExpiry = null;
    this.logger.log('Nomba token cache invalidated');
  }
}