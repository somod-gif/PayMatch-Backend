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
    accountId: process.env.NOMBA_ACCOUNT_ID ?? '',
    subAccountId: process.env.NOMBA_SUB_ACCOUNT_ID ?? '',
    clientId: process.env.NOMBA_CLIENT_ID ?? '',
    privateKey: process.env.NOMBA_PRIVATE_KEY ?? '',
    webhookSecret: process.env.NOMBA_WEBHOOK_SECRET ?? 'NombaHackathon2026',
  },
});