import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateVirtualAccountDto } from '../dto/create-virtual-account.dto';
import { NombaVirtualAccountService } from '../../nomba/services/nomba-virtual-account.service';

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
      return { success: true, data: existingVirtualAccount };
    }

    // Generate virtual account via Nomba
    const nombaResponse = await this.nombaVirtualAccountService.createVirtualAccount({
      customerName: invoice.customer.fullName,
      customerEmail: invoice.customer.email || '',
      customerId: invoice.customer.id,
    });

    // Create virtual account in database
    const virtualAccount = await this.prisma.virtualAccount.create({
      data: {
        invoiceId: dto.invoiceId,
        nombaAccountNumber: nombaResponse.accountNumber,
        accountName: nombaResponse.accountName,
        bankName: nombaResponse.bankName,
        accountReference: nombaResponse.providerReference,
      },
    });

    this.logger.log(`Virtual account created: ${virtualAccount.id}`);
    return { success: true, data: virtualAccount };
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
}