import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { HealthModule } from './health/health.module';
import { WebhookModule } from './webhook/webhook.module';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customers.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { VirtualAccountsModule } from './virtual-accounts/virtual-accounts.module';
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

    // Rate limiting module - protects against abuse
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 50, // 50 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 200, // 200 requests per minute
      },
    ]),

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
    VirtualAccountsModule,
  ],
})
export class AppModule {}
