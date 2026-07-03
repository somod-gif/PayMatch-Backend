import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma service that wraps the PrismaClient for dependency injection.
 * Handles connection lifecycle and provides database access to all services.
 *
 * Supports both standard PostgreSQL and Neon serverless connections.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private connectionAttempted = false;

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.connectionAttempted = true;
      this.logger.log('Database connection established');
    } catch (error: unknown) {
      this.logger.warn('Database connection failed - app will start without DB');
      this.logger.warn('Ensure DATABASE_URL is correct and database is accessible');
      this.logger.warn(`Error: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.connectionAttempted) {
      await this.$disconnect();
      this.logger.log('Database connection closed');
    }
  }

  /**
   * Checks if database is connected
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}