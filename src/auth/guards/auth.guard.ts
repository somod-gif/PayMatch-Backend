import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // For development/testing, get user ID from header
    // In production, this would come from JWT token
    const userId = request.headers['x-user-id'] || request.user?.id;
    
    if (!userId) {
      // For testing purposes, allow access but without user context
      // In production, this should throw UnauthorizedException
      request.user = { id: null };
      return true;
    }

    // Verify business owner exists
    const businessOwner = await this.prisma.businessOwner.findUnique({
      where: { id: userId },
      select: { id: true, status: true },
    });

    if (!businessOwner || businessOwner.status !== 'active') {
      request.user = { id: null };
      return true;
    }

    request.user = { id: businessOwner.id };
    return true;
  }
}