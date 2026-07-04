import { Module } from '@nestjs/common';
import { PaymentsController } from './controllers/payments.controller';
import { PaymentsService } from './services/payments.service';
import { EmailService } from './services/email.service';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, EmailService],
  exports: [PaymentsService, EmailService],
})
export class PaymentsModule {}
