import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { WebhookModule } from './webhook/webhook.module';
import appConfig from './config/app.config';

/**
 * Root application module.
 * Imports all feature modules and global configuration.
 *
 * Following the feature-first architecture, each module is self-contained
 * and can be developed independently.
 */
@Module({
  imports: [
    // Global configuration module - loads .env file and validates schema
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: '.env',
    }),
    HealthModule,
    WebhookModule,
  ],
})
export class AppModule {}