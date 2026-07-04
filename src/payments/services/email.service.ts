import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/**
 * Email service for sending payment-related emails.
 * Uses Resend for email delivery.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('resendApiKey');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  /**
   * Sends an invoice email to a customer.
   */
  async sendInvoiceEmail(
    to: string,
    customerName: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    paymentLink: string,
    accountDetails?: {
      bank: string;
      accountNumber: string;
      accountName: string;
    },
  ): Promise<{ success: boolean; message: string }> {
    const subject = `Invoice ${invoiceNumber} - Payment Request from PayMatch`;
    
    const body = this.generateInvoiceEmailBody(
      customerName,
      invoiceNumber,
      amount,
      currency,
      paymentLink,
      accountDetails,
    );

    if (!this.resend) {
      this.logger.warn('Resend API key not configured - email not sent');
      return { success: true, message: 'Email service not configured (development mode)' };
    }

    try {
      await this.resend.emails.send({
        from: 'PayMatch <onboarding@resend.dev>',
        to,
        subject,
        html: body,
      });

      this.logger.log(`Invoice email sent to ${to} for invoice ${invoiceNumber}`);
      return { success: true, message: 'Invoice email sent successfully.' };
    } catch (error) {
      this.logger.error(`Failed to send email: ${(error as Error).message}`);
      return { success: false, message: 'Failed to send email.' };
    }
  }

  /**
   * Sends a payment confirmation email.
   */
  async sendPaymentConfirmation(
    to: string,
    customerName: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    transactionRef: string,
  ): Promise<{ success: boolean; message: string }> {
    const subject = `Payment Confirmed - Invoice ${invoiceNumber}`;
    
    const body = `
      <h2>Payment Confirmation</h2>
      <p>Hello ${customerName},</p>
      <p>Your payment for invoice <strong>${invoiceNumber}</strong> has been confirmed.</p>
      <p><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</p>
      <p><strong>Transaction Reference:</strong> ${transactionRef}</p>
      <p>Thank you for your payment!</p>
    `;

    if (!this.resend) {
      this.logger.warn('Resend API key not configured - email not sent');
      return { success: true, message: 'Email service not configured (development mode)' };
    }

    try {
      await this.resend.emails.send({
        from: 'PayMatch <onboarding@resend.dev>',
        to,
        subject,
        html: body,
      });

      this.logger.log(`Payment confirmation sent to ${to}`);
      return { success: true, message: 'Payment confirmation email sent successfully.' };
    } catch (error) {
      this.logger.error(`Failed to send email: ${(error as Error).message}`);
      return { success: false, message: 'Failed to send email.' };
    }
  }

  private generateInvoiceEmailBody(
    customerName: string,
    invoiceNumber: string,
    amount: number,
    currency: string,
    paymentLink: string,
    accountDetails?: {
      bank: string;
      accountNumber: string;
      accountName: string;
    },
  ): string {
    let accountSection = '';
    
    if (accountDetails) {
      accountSection = `
        <h3>Bank Transfer Details</h3>
        <p><strong>Bank:</strong> ${accountDetails.bank}</p>
        <p><strong>Account Number:</strong> ${accountDetails.accountNumber}</p>
        <p><strong>Account Name:</strong> ${accountDetails.accountName}</p>
      `;
    }

    return `
      <h2>Invoice Payment Request</h2>
      <p>Hello ${customerName},</p>
      <p>You have a new invoice from PayMatch.</p>
      <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
      <p><strong>Amount:</strong> ${currency} ${amount.toLocaleString()}</p>
      ${accountSection}
      <p><a href="${paymentLink}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Payment Details</a></p>
      <p>Or visit: ${paymentLink}</p>
      <p>Thank you!</p>
    `;
  }
}