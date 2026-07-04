import { Module } from '@nestjs/common';
import { VirtualAccountsController } from './controllers/virtual-accounts.controller';
import { VirtualAccountsService } from './services/virtual-accounts.service';
import { NombaModule } from '../nomba/nomba.module';

/**
 * Virtual Accounts module.
 * Handles creation and management of virtual accounts for invoices.
 */
@Module({
  imports: [NombaModule],
  controllers: [VirtualAccountsController],
  providers: [VirtualAccountsService],
  exports: [VirtualAccountsService],
})
export class VirtualAccountsModule {}