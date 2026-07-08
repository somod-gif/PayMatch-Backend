/**
 * Application configuration loaded from environment variables.
 * All secrets and environment-specific values are centralized here.
 *
 * IMPORTANT: Never commit .env or expose secrets in documentation.
 */
export default () => ({
  port: parseInt(process.env.PORT ?? '5000', 10),

  corsOrigin: process.env.CORS_ORIGIN ?? '*',

  database: {
    url: process.env.DATABASE_URL ?? '',
  },

  nomba: {
    baseUrl: process.env.NOMBA_BASE_URL ?? 'https://sandbox.nomba.com',
    accountId: process.env.NOMBA_ACCOUNT_ID ?? '',
    subAccountId: process.env.NOMBA_SUB_ACCOUNT_ID ?? '',
    clientId: process.env.NOMBA_CLIENT_ID ?? '',
    clientSecret: process.env.NOMBA_CLIENT_SECRET ?? '',
    privateKey: process.env.NOMBA_PRIVATE_KEY ?? '',
    webhookSecret: process.env.NOMBA_WEBHOOK_SECRET ?? 'NombaHackathon2026',
  },

  resendApiKey: process.env.RESEND_API_KEY ?? '',

  // Verified sender address, e.g. "PayMatch <noreply@yourdomain.com>".
  // Must use a domain verified at https://resend.com/domains or Resend will
  // reject sends to anyone other than the account owner (free/test tier).
  resendFromEmail: process.env.RESEND_FROM_EMAIL ?? 'PayMatch <onboarding@resend.dev>',

  // On the free/test tier (resend.dev), Resend can only deliver to the
  // account owner. When a customer send is rejected, the email is re-routed
  // to this address so it is still delivered for testing. Set to the address
  // you want to receive these test copies (defaults to the Resend owner).
  resendTestRecipient: process.env.RESEND_TEST_RECIPIENT ?? 'eniolabadmus351@gmail.com',

  geminiApiKey: process.env.GEMINI_API_KEY ?? '',

  paymentUrl: process.env.PAYMENT_URL ?? 'https://paymatch-frontend.vercel.app',
});
