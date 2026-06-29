import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { LoggerInterceptor } from './shared/logger.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Global validation pipe for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      transform: true, // Auto-transform payloads to DTO instances
      disableErrorMessages: false,
    }),
  );

  // Global logger interceptor for structured HTTP logging
  app.useGlobalInterceptors(new LoggerInterceptor());

  // CORS configuration
  app.enableCors({
    origin: '*', // TODO: Restrict to specific origins in production
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = configService.get<number>('port', 3000);
  await app.listen(port);

  logger.log(`PayMatch API is running on port ${port}`);
  logger.log(`Health check: http://localhost:${port}/health`);
}

bootstrap();