import { Module } from '@nestjs/common';
import { InvoicesController } from './controllers/invoices.controller';
import { InvoicesService } from './services/invoices.service';

@Module({
  controllers: [InvoicesController],
  providers: [InvoicesService],
  exports: [InvoicesService],
})
export class InvoicesModule {}