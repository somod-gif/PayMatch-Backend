import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVirtualAccountDto } from '../dto/create-virtual-account.dto';
import { NombaVirtualAccountService } from '../../nomba/services/nomba-virtual-account.service';

type VirtualAccountResponseData = {
  bankName: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  accountRef: string;
  currency: string;
  paymentStatus: 'PENDING';
};

@Injectable()
export class VirtualAccountsService {
  private readonly logger = new Logger(VirtualAccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nombaVirtualAccountService: NombaVirtualAccountService,
  ) {}

  async create(dto: CreateVirtualAccountDto, businessOwnerId: string) {
    this.logger.log(`Creating virtual account for invoice: ${dto.invoiceId}`);

    // Verify invoice belongs to business owner
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: dto.invoiceId, businessOwnerId },
      include: { customer: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found or does not belong to your business');
    }

    // Check if virtual account already exists
    const existingVirtualAccount = await this.prisma.virtualAccount.findUnique({
      where: { invoiceId: dto.invoiceId },
    });

    if (existingVirtualAccount) {
      return {
        success: true,
        message: 'Virtual account generated successfully.',
        data: this.toResponseData(existingVirtualAccount),
      };
    }

    // Generate virtual account via Nomba
    const nombaResponse = await this.nombaVirtualAccountService.createVirtualAccount({
      accountRef: this.buildAccountRef(invoice.invoiceNumber),
      accountName: invoice.customer.fullName,
      expectedAmount: Number(invoice.expectedAmount),
    });

    // Create virtual account in database
    const virtualAccount = await this.prisma.virtualAccount.create({
      data: {
        invoiceId: dto.invoiceId,
        customerId: invoice.customerId,
        expectedAmount: invoice.expectedAmount,
        currency: invoice.currency,
        accountRef: nombaResponse.accountRef,
        bankName: nombaResponse.bankName,
        bankAccountNumber: nombaResponse.accountNumber,
        bankAccountName: nombaResponse.accountName,
        nombaAccountNumber: nombaResponse.accountNumber,
        accountName: nombaResponse.accountName,
        accountReference: nombaResponse.accountRef,
      },
    });

    this.logger.log(`Virtual account created: ${virtualAccount.id}`);
    return {
      success: true,
      message: 'Virtual account generated successfully.',
      data: this.toResponseData(virtualAccount),
    };
  }

  async findAll(businessOwnerId: string) {
    const virtualAccounts = await this.prisma.virtualAccount.findMany({
      where: {
        invoice: {
          businessOwnerId,
        },
      },
      include: {
        invoice: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: virtualAccounts };
  }

  private buildAccountRef(invoiceNumber: string): string {
    return `${invoiceNumber}-${Date.now()}-${randomUUID()}`;
  }

  private toResponseData(virtualAccount: {
    bankName: string;
    bankAccountNumber?: string | null;
    bankAccountName?: string | null;
    nombaAccountNumber?: string | null;
    accountName?: string | null;
    accountRef?: string | null;
    accountReference?: string | null;
    currency?: string | null;
    expectedAmount?: Prisma.Decimal | number | string | null;
  }): VirtualAccountResponseData {
    const amount = virtualAccount.expectedAmount == null ? 0 : Number(virtualAccount.expectedAmount);

    return {
      bankName: virtualAccount.bankName,
      accountNumber: virtualAccount.bankAccountNumber || virtualAccount.nombaAccountNumber || '',
      accountName: virtualAccount.bankAccountName || virtualAccount.accountName || '',
      amount,
      accountRef: virtualAccount.accountRef || virtualAccount.accountReference || '',
      currency: virtualAccount.currency || 'NGN',
      paymentStatus: 'PENDING',
    };
  }
}