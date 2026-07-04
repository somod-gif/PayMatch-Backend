import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Extract user ID from header for development/testing
    const userId = req.headers['x-user-id'] as string;
    
    if (userId) {
      // Attach user to request object
      (req as any).user = { id: userId };
    }
    
    next();
  }
}