/**
 * Application configuration loaded from environment variables.
 * All secrets and environment-specific values are centralized here.
 */
export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),

  nomba: {
    accountId: process.env.NOMBA_ACCOUNT_ID ?? '',
    subAccountId: process.env.NOMBA_SUB_ACCOUNT_ID ?? '',
    clientId: process.env.NOMBA_CLIENT_ID ?? '',
    privateKey: process.env.NOMBA_PRIVATE_KEY ?? '',
    webhookSecret: process.env.NOMBA_WEBHOOK_SECRET ?? 'NombaHackathon2026',
  },
});