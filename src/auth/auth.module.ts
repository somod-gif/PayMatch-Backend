import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';

/**
 * Authentication module.
 * Handles customer registration and login.
 * To be extended with JWT, OAuth, and proper password hashing.
 */
@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}