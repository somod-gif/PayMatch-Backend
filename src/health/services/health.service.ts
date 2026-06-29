import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_NAME, APP_VERSION, SERVICE_STATUS } from '../../common/constants/app.constants';

/**
 * Service responsible for health check operations.
 * Uses dependency injection for configuration and maintains separation of concerns.
 */
@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Returns the root API information including service name, status, and version.
   */
  getApiInfo() {
    return {
      success: true,
      service: APP_NAME,
      status: SERVICE_STATUS,
      version: APP_VERSION,
    };
  }

  /**
   * Returns the current health status of the application.
   * Includes uptime and timestamp for monitoring purposes.
   */
  getHealthStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
    };
  }
}