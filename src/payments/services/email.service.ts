import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

/**
 * Email service for sending payment-related emails.
 * Uses Resend for email delivery.
 *
 * SENDING MODES
 * -------------
 * 1. Production (verified domain): set RESEND_FROM_EMAIL to a sender on a
 *    domain you verified at https://resend.com/domains (e.g.
 *    "PayMatch <noreply@yourdomain.com>"). Emails are delivered to the real
 *    customer address.
 *
 * 2. Test mode (resend.dev, no verified domain): Resend's free/test tier only
 *    permits the shared "onboarding@resend.dev" sender to deliver to the
 *    account owner's own verified email. To keep the feature working for
 *    demos, when a send to a customer is rejected, the email is automatically
 *    re-routed to RESEND_TEST_RECIPIENT (defaults to the account owner) so it
 *    is still delivered via the resend.dev domain. Set RESEND_TEST_RECIPIENT
 *    to the address you want to receive these test copies.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private readonly fromEmail: string;
  private readonly testRecipient: string | null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('resendApiKey');
    this.fromEmail = this.configService.get<string>(
      'resendFromEmail',
      'PayMatch <onboarding@resend.dev>',
    );
    this.testRecipient =
      this.configService.get<string>('resendTestRecipient') || null;
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
      return { success: false, message: 'Email service not configured.' };
    }

    return this.deliver(to, subject, body);
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
      return { success: false, message: 'Email service not configured.' };
    }

    return this.deliver(to, subject, body);
  }

  /**
   * Attempts to deliver an email. If the primary recipient is rejected by
   * Resend's test-mode restriction (resend.dev can only send to the account
   * owner), it re-routes the message to RESEND_TEST_RECIPIENT so it is still
   * delivered via the resend.dev domain.
   */
  private async deliver(
    to: string,
    subject: string,
    html: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await this.resend!.emails.send({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      if (error) {
        // Test-mode restriction: resend.dev can only deliver to the owner.
        if (
          this.testRecipient &&
          this.testRecipient.toLowerCase() !== to.toLowerCase()
        ) {
          this.logger.warn(
            `Resend rejected send to ${to} (${error.message}). Re-routing to test recipient ${this.testRecipient}.`,
          );
          return this.deliverToTestRecipient(to, subject, html);
        }

        this.logger.error(`Failed to send email to ${to}: ${error.message}`);
        return { success: false, message: error.message };
      }

      this.logger.log(`Email sent to ${to} (id: ${data?.id})`);
      return { success: true, message: 'Email sent successfully.' };
    } catch (error) {
      const message = (error as Error).message;
      this.logger.error(`Failed to send email: ${message}`);
      return { success: false, message };
    }
  }

  private async deliverToTestRecipient(
    originalTo: string,
    subject: string,
    html: string,
  ): Promise<{ success: boolean; message: string }> {
    const note = `
      <div style="border:1px solid #f59e0b; background:#fffbeb; padding:10px; margin-bottom:16px; color:#92400e;">
        <strong>Test mode notice:</strong> Resend's free/test tier (resend.dev) can only
        deliver to the account owner. This email was intended for
        <strong>${originalTo}</strong> and has been re-routed here for testing.
      </div>
    `;

    try {
      const { data, error } = await this.resend!.emails.send({
        from: this.fromEmail,
        to: this.testRecipient!,
        subject: `[TEST] ${subject}`,
        html: note + html,
      });

      if (error) {
        this.logger.error(
          `Failed to send test-mode email to ${this.testRecipient}: ${error.message}`,
        );
        return { success: false, message: error.message };
      }

      this.logger.log(
        `Test-mode email re-routed to ${this.testRecipient} (id: ${data?.id})`,
      );
      return {
        success: true,
        message: `Delivered in test mode to ${this.testRecipient} (Resend free tier can't reach ${originalTo} yet). Verify a domain to email customers directly.`,
      };
    } catch (error) {
      const message = (error as Error).message;
      this.logger.error(`Failed to send test-mode email: ${message}`);
      return { success: false, message };
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