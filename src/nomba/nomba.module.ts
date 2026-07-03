import { Module } from '@nestjs/common';
import { NombaAuthService } from './services/nomba-auth.service';
import { NombaVirtualAccountService } from './services/nomba-virtual-account.service';
import { NombaTransactionService } from './services/nomba-transaction.service';
import { NombaWebhookVerificationService } from './services/nomba-webhook-verification.service';

/**
 * Nomba module providing reusable services for Nomba API integration.
 * All services use interfaces and abstractions for easy implementation after Stage 1.
 *
 * Exports all services so feature modules can inject them directly.
 */
@Module({
  providers: [
    NombaAuthService,
    NombaVirtualAccountService,
    NombaTransactionService,
    NombaWebhookVerificationService,
  ],
  exports: [
    NombaAuthService,
    NombaVirtualAccountService,
    NombaTransactionService,
    NombaWebhookVerificationService,
  ],
})
export class NombaModule {}