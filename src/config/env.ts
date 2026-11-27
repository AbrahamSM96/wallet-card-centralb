import { z } from 'zod'

const environmentSchema = z.object({
  APPLE_APNS_KEY_BASE64: z.string().min(1).optional(),
  APPLE_APNS_KEY_ID: z.string().min(1).optional(),
  APPLE_PASS_CERT_BASE64: z.string().min(1).optional(),
  APPLE_PASS_KEY_BASE64: z.string().min(1).optional(),
  APPLE_PASS_KEY_PASSPHRASE: z.string().optional(),
  APPLE_PASS_TYPE_ID: z.string().min(1).optional(),
  APPLE_TEAM_ID: z.string().min(1).optional(),
  APPLE_WWDR_CERT_BASE64: z.string().min(1).optional(),
  APP_URL: z.url(),
  CRON_SECRET: z.string().min(32).optional(),
  DATABASE_URL: z.url().startsWith('postgres'),
  GOOGLE_WALLET_CLASS_SUFFIX: z.string().min(1).optional(),
  GOOGLE_WALLET_ISSUER_ID: z.string().min(1).optional(),
  GOOGLE_WALLET_LOGO_URL: z.url().optional(),
  GOOGLE_WALLET_SERVICE_ACCOUNT_BASE64: z.string().min(1).optional(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  SESSION_SECRET: z.string().min(32),
})

export const env = environmentSchema.parse({
  APPLE_APNS_KEY_BASE64: process.env.APPLE_APNS_KEY_BASE64 || undefined,
  APPLE_APNS_KEY_ID: process.env.APPLE_APNS_KEY_ID || undefined,
  APPLE_PASS_CERT_BASE64: process.env.APPLE_PASS_CERT_BASE64 || undefined,
  APPLE_PASS_KEY_BASE64: process.env.APPLE_PASS_KEY_BASE64 || undefined,
  APPLE_PASS_KEY_PASSPHRASE: process.env.APPLE_PASS_KEY_PASSPHRASE || undefined,
  APPLE_PASS_TYPE_ID: process.env.APPLE_PASS_TYPE_ID || undefined,
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID || undefined,
  APPLE_WWDR_CERT_BASE64: process.env.APPLE_WWDR_CERT_BASE64 || undefined,
  APP_URL: process.env.APP_URL,
  CRON_SECRET: process.env.CRON_SECRET || undefined,
  DATABASE_URL: process.env.DATABASE_URL,
  GOOGLE_WALLET_CLASS_SUFFIX:
    process.env.GOOGLE_WALLET_CLASS_SUFFIX || undefined,
  GOOGLE_WALLET_ISSUER_ID: process.env.GOOGLE_WALLET_ISSUER_ID || undefined,
  GOOGLE_WALLET_LOGO_URL: process.env.GOOGLE_WALLET_LOGO_URL || undefined,
  GOOGLE_WALLET_SERVICE_ACCOUNT_BASE64:
    process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_BASE64 || undefined,
  NODE_ENV: process.env.NODE_ENV,
  SESSION_SECRET: process.env.SESSION_SECRET,
})
