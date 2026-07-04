import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePaymentDto, QueryPaymentDto } from '../dto/create-payment.dto';
import { EmailService } from './email.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

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

  async getPaymentLink(invoiceNumber: string, businessOwnerId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { invoiceNumber, businessOwnerId },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with number ${invoiceNumber} not found`);
    }

    const paymentUrl = this.configService.get<string>('paymentUrl', 'https://paymatch-frontend.vercel.app');
    
    return {
      success: true,
      invoiceNumber,
      paymentUrl: `${paymentUrl}/pay/${invoiceNumber}`,
    };
  }

  async getShareInfo(invoiceNumber: string, businessOwnerId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { invoiceNumber, businessOwnerId },
      include: {
        customer: true,
        virtualAccount: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with number ${invoiceNumber} not found`);
    }

    if (!invoice.virtualAccount) {
      throw new NotFoundException(`No virtual account found for invoice ${invoiceNumber}`);
    }

    const paymentUrl = this.configService.get<string>('paymentUrl', 'https://paymatch-frontend.vercel.app');
    const amount = parseFloat(invoice.expectedAmount.toString());
    
    // Generate WhatsApp message
    const whatsappMessage = this.generateWhatsAppMessage(
      invoice.customer.fullName,
      invoiceNumber,
      amount,
      invoice.currency,
      invoice.virtualAccount.bankName,
      invoice.virtualAccount.nombaAccountNumber,
      invoice.virtualAccount.accountName,
      paymentUrl,
    );

    // Generate copy text
    const copyText = this.generateCopyText(
      invoiceNumber,
      amount,
      invoice.currency,
      invoice.virtualAccount.bankName,
      invoice.virtualAccount.nombaAccountNumber,
      invoice.virtualAccount.accountName,
      paymentUrl,
    );

    return {
      success: true,
      customer: invoice.customer.fullName,
      email: invoice.customer.email,
      phone: invoice.customer.phone,
      amount,
      currency: invoice.currency,
      bank: invoice.virtualAccount.bankName,
      accountNumber: invoice.virtualAccount.nombaAccountNumber,
      accountName: invoice.virtualAccount.accountName,
      paymentLink: `${paymentUrl}/pay/${invoiceNumber}`,
      whatsappMessage,
      whatsappUrl: `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`,
      emailSubject: `Invoice ${invoiceNumber} - Payment Request from PayMatch`,
      emailBody: this.generateEmailBody(
        invoice.customer.fullName,
        invoiceNumber,
        amount,
        invoice.currency,
        invoice.virtualAccount.bankName,
        invoice.virtualAccount.nombaAccountNumber,
        invoice.virtualAccount.accountName,
        paymentUrl,
      ),
      copyText,
    };
  }

  async sendInvoiceEmail(
    invoiceNumber: string,
    email: string,
    businessOwnerId: string,
    emailService: EmailService,
  ) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { invoiceNumber, businessOwnerId },
      include: {
        customer: true,
        virtualAccount: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with number ${invoiceNumber} not found`);
    }

    const paymentUrl = this.configService.get<string>('paymentUrl', 'https://paymatch-frontend.vercel.app');
    const amount = parseFloat(invoice.expectedAmount.toString());

    const accountDetails = invoice.virtualAccount ? {
      bank: invoice.virtualAccount.bankName,
      accountNumber: invoice.virtualAccount.nombaAccountNumber,
      accountName: invoice.virtualAccount.accountName,
    } : undefined;

    const result = await emailService.sendInvoiceEmail(
      email,
      invoice.customer.fullName,
      invoiceNumber,
      amount,
      invoice.currency,
      `${paymentUrl}/pay/${invoiceNumber}`,
      accountDetails,
    );

    return result;
  }

  private generateWhatsAppMessage(
    customerName: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    bank: string,
    accountNumber: string,
    accountName: string,
    paymentUrl: string,
  ): string {
    return `Hello ${customerName},

Your invoice ${invoiceNumber} is ready.

Amount: ${currency} ${amount.toLocaleString()}

Please make payment using:

Bank:
${bank}

Account Number:
${accountNumber}

Account Name:
${accountName}

You can also view your payment instructions here:

${paymentUrl}/pay/${invoiceNumber}

Thank you.`;
  }

  private generateCopyText(
    invoiceNumber: string,
    amount: number,
    currency: string,
    bank: string,
    accountNumber: string,
    accountName: string,
    paymentUrl: string,
  ): string {
    return `Invoice: ${invoiceNumber}

Amount: ${currency} ${amount.toLocaleString()}

Bank:
${bank}

Account Number:
${accountNumber}

Account Name:
${accountName}

Payment Link:
${paymentUrl}/pay/${invoiceNumber}`;
  }

  private generateEmailBody(
    customerName: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    bank: string,
    accountNumber: string,
    accountName: string,
    paymentUrl: string,
  ): string {
    return `
      <h2>Invoice Payment Request</h2>
      <p>Hello ${customerName},</p>
      <p>You have a new invoice from PayMatch.</p>
      <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
      <p><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</p>
      <h3>Bank Transfer Details</h3>
      <p><strong>Bank:</strong> ${bank}</p>
      <p><strong>Account Number:</strong> ${accountNumber}</p>
      <p><strong>Account Name:</strong> ${accountName}</p>
      <p><a href="${paymentUrl}/pay/${invoiceNumber}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Payment Details</a></p>
      <p>Or visit: ${paymentUrl}/pay/${invoiceNumber}</p>
      <p>Thank you!</p>
    `;
  }
}
