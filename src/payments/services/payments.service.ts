import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto, QueryPaymentDto } from '../dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePaymentDto, businessOwnerId: string) {
    this.logger.log(`Creating payment: ${dto.merchantTxRef}`);

    // Verify invoice belongs to business owner
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, businessOwnerId },
      include: { customer: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found or does not belong to your business');
    }

    const payment = await this.prisma.payment.create({
      data: {
        invoiceId: dto.invoiceId,
        customerId: dto.customerId,
        merchantTxRef: dto.merchantTxRef,
        amount: dto.amount,
        currency: dto.currency ?? 'NGN',
        paymentMethod: dto.paymentMethod,
        status: 'success',
        receivedAt: new Date(),
      },
      include: { invoice: true, customer: true },
    });

    return { success: true, data: payment };
  }

  async findAll(query?: QueryPaymentDto, businessOwnerId?: string) {
    const where: any = {};
    if (query?.invoiceId) where.invoiceId = query.invoiceId;
    if (query?.customerId) where.customerId = query.customerId;
    if (query?.status) where.status = query.status;
    
    // Filter by business owner through invoice
    if (businessOwnerId) {
      where.invoice = { businessOwnerId };
    }

    const payments = await this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { 
        invoice: { 
          include: { 
            customer: true,
            businessOwner: true,
          } 
        }, 
        customer: true,
      },
    });

    return { success: true, data: payments };
  }

  async findOne(id: string, businessOwnerId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { 
        id,
        invoice: { businessOwnerId },
      },
      include: { 
        invoice: { 
          include: { 
            customer: true,
            businessOwner: true,
          } 
        }, 
        customer: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return { success: true, data: payment };
  }

  async findByReference(reference: string, businessOwnerId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { 
        merchantTxRef: reference,
        invoice: { businessOwnerId },
      },
      include: { 
        invoice: { 
          include: { 
            customer: true,
            businessOwner: true,
          } 
        }, 
        customer: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment with reference ${reference} not found`);
    }

    return { success: true, data: payment };
  }
}