import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvoiceDto, UpdateInvoiceDto } from '../dto/create-invoice.dto';
import * as crypto from 'crypto';

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInvoiceDto, businessOwnerId: string) {
    this.logger.log(`Creating invoice for customer: ${dto.customerId}`);

    // Verify customer belongs to business owner
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, businessOwnerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found or does not belong to your business');
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        businessOwnerId,
        customerId: dto.customerId,
        invoiceNumber: dto.invoiceNumber,
        expectedAmount: dto.expectedAmount,
        currency: dto.currency ?? 'NGN',
        description: dto.description || 'Invoice',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: { 
        customer: true,
        businessOwner: true,
      },
    });

    return { success: true, data: invoice };
  }

  async findAll(businessOwnerId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { businessOwnerId },
      orderBy: { createdAt: 'desc' },
      include: { 
        customer: true, 
        payments: true,
        virtualAccount: true,
      },
    });

    return { success: true, data: invoices };
  }

  async findOne(id: string, businessOwnerId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { 
        id,
        businessOwnerId,
      },
      include: { 
        customer: true, 
        payments: true,
        virtualAccount: true,
        businessOwner: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    return { success: true, data: invoice };
  }

  async update(id: string, dto: UpdateInvoiceDto, businessOwnerId: string) {
    const existing = await this.prisma.invoice.findFirst({ 
      where: { id, businessOwnerId }
    });
    
    if (!existing) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    const updateData: any = {};
    if (dto.expectedAmount) updateData.expectedAmount = dto.expectedAmount;
    if (dto.description) updateData.description = dto.description;
    if (dto.status) {
      updateData.status = dto.status;
      if (dto.status === 'paid') {
        updateData.paidAt = new Date();
      }
    }
    if (dto.dueDate) updateData.dueDate = new Date(dto.dueDate);

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: { 
        customer: true,
        businessOwner: true,
      },
    });

    return { success: true, data: invoice };
  }
}