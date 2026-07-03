import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { WebhookModule } from './webhook/webhook.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NombaModule } from './nomba/nomba.module';
import { PrismaModule } from './prisma/prisma.module';
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

    // Database module (global - provides PrismaService everywhere)
    PrismaModule,

    // Nomba integration module (provides reusable Nomba services)
    NombaModule,

    // Feature modules
    HealthModule,
    WebhookModule,
    AuthModule,
    CustomersModule,
    InvoicesModule,
    PaymentsModule,
    DashboardModule,
  ],
})
export class AppModule {}