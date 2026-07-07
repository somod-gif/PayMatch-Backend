import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { NombaAuthToken } from '../interfaces/nomba.interface';

/**
 * Nomba OAuth authentication service.
 * Handles token acquisition, caching, and automatic refresh.
 *
 * Authentication Flow (Sandbox):
 * 1. POST to {NOMBA_BASE_URL}/v1/auth/token/issue
 * 2. Body: { client_id, client_secret, grant_type: 'client_credentials' }
 * 3. Cache the access token in-memory with expiry buffer
 * 4. Return valid token, refreshing automatically when expired
 */
@Injectable()
export class NombaAuthService {
  private readonly logger = new Logger(NombaAuthService.name);
  private cachedToken: NombaAuthToken | null = null;
  private tokenExpiry: Date | null = null;
  private readonly baseUrl: string;
  private readonly isProduction: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = this.configService.get<string>('nomba.baseUrl', 'https://sandbox.nomba.com');
    this.isProduction = this.baseUrl.includes('api.nomba.com');
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
   * POST to /v1/auth/token/issue with client_id and client_secret.
   */
  private async authenticate(): Promise<NombaAuthToken> {
    const clientId = this.configService.get<string>('nomba.clientId');
    const clientSecret = this.configService.get<string>('nomba.clientSecret');
    const privateKey = this.configService.get<string>('nomba.privateKey');

    // Use client_secret if available, otherwise fall back to private_key
    const secret = clientSecret || privateKey;

    if (!clientId || !secret) {
      throw new HttpException(
        {
          success: false,
          message: 'Nomba API credentials not configured. Set NOMBA_CLIENT_ID and NOMBA_CLIENT_SECRET (or NOMBA_PRIVATE_KEY) in .env',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      const url = `${this.baseUrl}/v1/auth/token/issue`;
      this.logger.log(`[Nomba Auth] POST ${url}`);

      const response = await lastValueFrom(
        this.httpService.post(url, {
          client_id: clientId,
          client_secret: secret,
          grant_type: 'client_credentials',
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }),
      );

      this.logger.log(`[Nomba Auth] Response status: ${response.status}`);

      if (!response.data.access_token) {
        this.logger.error(`[Nomba Auth] Response missing access_token: ${JSON.stringify(response.data)}`);
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
      const errorData = error?.response?.data;

      // Log full error in development only
      if (!this.isProduction && errorData) {
        this.logger.error(`[Nomba Auth] Error response: ${JSON.stringify(errorData)}`);
      }

      const errorMessage = errorData?.message
        || errorData?.error
        || errorData?.error_description
        || error?.message
        || 'Unknown error during Nomba authentication';

      this.logger.error(`[Nomba Auth] Authentication failed: ${errorMessage}`);

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