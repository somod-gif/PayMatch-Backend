import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { LoggerInterceptor } from './shared/logger.interceptor';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security: Helmet middleware for HTTP headers
  app.use(helmet());

  // Security: CORS configuration
  app.enableCors({
    origin: configService.get<string>('corsOrigin', '*'),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-nomba-signature'],
    credentials: true,
  });

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Auto-transform payloads to DTO instances
      disableErrorMessages: false,
    }),
  );

  // Global exception filter for standardized error responses
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Global logger interceptor for structured HTTP logging
  app.useGlobalInterceptors(new LoggerInterceptor());

  // Swagger API documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PayMatch API')
    .setDescription('Payment Reconciliation Platform - Nomba Hackathon 2026')
    .setVersion('1.0.0')
    .addTag('Health', 'Health check and API information endpoints')
    .addTag('Authentication', 'Customer registration and login endpoints')
    .addTag('Customers', 'Customer management endpoints')
    .addTag('Invoices', 'Invoice management endpoints')
    .addTag('Payments', 'Payment transaction endpoints')
    .addTag('Dashboard', 'Dashboard summary and metrics endpoints')
    .addTag('Webhooks', 'Incoming webhook endpoints for Nomba events')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Set global prefix for all routes
  // IMPORTANT: Webhook endpoint must remain at /webhooks/nomba (no prefix)
  // This is a production integration already registered with Nomba
  app.setGlobalPrefix('api/v1', { exclude: ['/health', '/webhooks/:path'] });

  const port = configService.get<number>('port', 5000);
  await app.listen(port);

  logger.log(`PayMatch API is running on port ${port}`);
  logger.log(`Health check: http://localhost:${port}/health`);
  logger.log(`API docs: http://localhost:${port}/api/docs`);
  logger.log(`API base: http://localhost:${port}/api/v1`);
}

bootstrap();