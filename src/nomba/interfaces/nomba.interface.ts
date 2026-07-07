/**
 * Nomba API service interfaces.
 * These interfaces match the Nomba API specification.
 */

export interface NombaAuthToken {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
}

export interface NombaVirtualAccountRequest {
  customerEmail: string;
  customerName: string;
  phone?: string;
  preferredBank?: string;
  /** Optional: reference to link this VA to an invoice */
  invoiceReference?: string;
}

export interface NombaVirtualAccountResponse {
  accountName: string;
  accountNumber: string;
  bankName: string;
  providerReference: string;
  /** Optional: bank code returned by Nomba */
  bankCode?: string;
  /** Optional: reserved amount if set */
  reservedAmount?: number;
}

export interface NombaTransactionRequest {
  amount: number;
  currency: string;
  reference: string;
  customerEmail: string;
  customerName: string;
  description?: string;
  callbackUrl?: string;
}

export interface NombaTransactionResponse {
  status: string;
  reference: string;
  providerReference: string;
  amount: number;
  currency: string;
  paymentUrl?: string;
}

export interface NombaTransferRequest {
  amount: number;
  currency: string;
  reference: string;
  recipientAccount: string;
  recipientBank: string;
  recipientName: string;
  narration?: string;
}

export interface NombaTransferResponse {
  status: string;
  reference: string;
  providerReference: string;
  amount: number;
  currency: string;
}

export interface NombaWebhookPayload {
  event: string;
  requestId?: string;
  data?: Record<string, unknown>;
  raw?: Record<string, unknown>;
}