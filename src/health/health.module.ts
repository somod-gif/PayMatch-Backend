import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { HealthService } from './services/health.service';

/**
 * Health module responsible for monitoring and health check endpoints.
 * This module is self-contained and can be easily extended with additional
 * health indicators (e.g., database connectivity, external service checks).
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}