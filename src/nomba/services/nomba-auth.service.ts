import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NombaAuthToken } from '../interfaces/nomba.interface';

/**
 * Reusable service for Nomba OAuth authentication.
 * Handles token acquisition, caching, and refresh.
 *
 * TODO: Implement actual HTTP calls to Nomba OAuth endpoint
 * - Use POST to Nomba auth URL with client credentials
 * - Cache the access token in-memory or Redis
 * - Implement token refresh before expiry
 * - Handle 401 responses with automatic retry
 */
@Injectable()
export class NombaAuthService {
  private readonly logger = new Logger(NombaAuthService.name);
  private cachedToken: NombaAuthToken | null = null;
  private tokenExpiry: Date | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Returns a valid access token, reusing cached token if not expired.
   * Placeholder implementation returning demo token.
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
   * Authenticates with Nomba API using client credentials.
   * Placeholder - implements actual OAuth flow after Stage 1.
   */
  private async authenticate(): Promise<NombaAuthToken> {
    // TODO: Implement actual OAuth authentication
    // const response = await this.httpService.post('/auth/token', {
    //   client_id: this.configService.get('nomba.clientId'),
    //   private_key: this.configService.get('nomba.privateKey'),
    //   grant_type: 'client_credentials',
    // }).toPromise();
    //
    // return {
    //   accessToken: response.data.access_token,
    //   expiresIn: response.data.expires_in,
    //   tokenType: response.data.token_type,
    // };

    this.logger.warn('Nomba OAuth not yet implemented - using placeholder token');

    return {
      accessToken: 'placeholder_nomba_token',
      expiresIn: 3600,
      tokenType: 'Bearer',
    };
  }

  private cacheToken(token: NombaAuthToken): void {
    this.cachedToken = token;
    this.tokenExpiry = new Date(Date.now() + (token.expiresIn - 300) * 1000); // 5 min buffer
    this.logger.log(`Nomba token cached, expires at ${this.tokenExpiry.toISOString()}`);
  }

  invalidateCache(): void {
    this.cachedToken = null;
    this.tokenExpiry = null;
    this.logger.log('Nomba token cache invalidated');
  }
}