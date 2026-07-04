import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from '../services/health.service';

/**
 * Controller handling health check and root API endpoints.
 * Business logic is delegated to HealthService to keep controllers lean.
 */
@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * GET / - Returns API information including service name, status, and version.
   */
  @Get('/')
  @ApiOperation({ summary: 'Get API information' })
  @ApiResponse({ status: 200, description: 'API information retrieved successfully' })
  getApiInfo() {
    return this.healthService.getApiInfo();
  }

  /**
   * GET /health - Returns the current health status of the application.
   * Used by monitoring systems and load balancers.
   */
  @Get('/health')
  @ApiOperation({ summary: 'Get health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  getHealthStatus() {
    return this.healthService.getHealthStatus();
  }
}
