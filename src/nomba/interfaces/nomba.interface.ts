/**
 * Nomba API service interfaces.
 * These abstractions define the contract for Nomba integration,
 * allowing implementation to be completed after Stage 1.
 */

export interface NombaAuthToken {
  accessToken: string;
  expiresIn: number;
  tokenType: string;
  scope?: string;
}

export interface NombaVirtualAccountRequest {
  customerId: string;
  customerEmail: string;
  customerName: string;
  phone?: string;
  preferredBank?: string;
}

export interface NombaVirtualAccountResponse {
  accountName: string;
  accountNumber: string;
  bankName: string;
  providerReference: string;
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