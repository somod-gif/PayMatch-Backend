import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

/**
 * Interceptor that logs incoming HTTP requests and their responses.
 * Implements structured logging with method, URL, timestamp, and safe headers.
 *
 * Sensitive information (authorization, private keys) is excluded from logs.
 */
@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, originalUrl } = request;
    const timestamp = new Date().toISOString();

    // Sanitize headers to exclude sensitive data
    const safeHeaders = { ...request.headers };
    delete safeHeaders['authorization'];
    delete safeHeaders['x-nomba-private-key'];
    delete safeHeaders['cookie'];

    this.logger.log(
      `[${timestamp}] ${method} ${originalUrl}`,
    );
    this.logger.debug(
      `Headers: ${JSON.stringify(safeHeaders)}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          this.logger.log(
            `[${new Date().toISOString()}] ${method} ${originalUrl} -> ${response.statusCode}`,
          );
        },
        error: (error) => {
          this.logger.error(
            `[${new Date().toISOString()}] ${method} ${originalUrl} -> ${error.status ?? 500}`,
            error.stack,
          );
        },
      }),
    );
  }
}