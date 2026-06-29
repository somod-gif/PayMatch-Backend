import { Controller, Get } from '@nestjs/common';
import { HealthService } from '../services/health.service';

/**
 * Controller handling health check and root API endpoints.
 * Business logic is delegated to HealthService to keep controllers lean.
 */
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * GET / - Returns API information including service name, status, and version.
   */
  @Get('/')
  getApiInfo() {
    return this.healthService.getApiInfo();
  }

  /**
   * GET /health - Returns the current health status of the application.
   * Used by monitoring systems and load balancers.
   */
  @Get('/health')
  getHealthStatus() {
    return this.healthService.getHealthStatus();
  }
}