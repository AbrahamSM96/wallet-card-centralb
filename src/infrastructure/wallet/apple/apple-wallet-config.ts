import { env } from '@/config/env'
import { z } from 'zod'

const decodedValueSchema = z.string().min(1)

export type AppleWalletConfig = {
  apnsKey: string
  apnsKeyId: string
  appUrl: string
  passCertificate: Buffer
  passKey: Buffer
  passKeyPassphrase?: string
  passTypeIdentifier: string
  teamIdentifier: string
  wwdrCertificate: Buffer
}

/** Indicates that optional Apple Wallet credentials are not configured. */
export class AppleWalletConfigurationError extends Error {
  /** Creates a stable, user-safe configuration error. */
  constructor() {
    super(
      'Apple Wallet is not configured. Set signing certificates, pass identifiers, and APNs credentials.'
    )
    this.name = 'AppleWalletConfigurationError'
  }
}

/** Loads and validates Apple Wallet configuration only when needed. */
export function getAppleWalletConfig(): AppleWalletConfig {
  const values = {
    apnsKey: decodeText(env.APPLE_APNS_KEY_BASE64),
    apnsKeyId: env.APPLE_APNS_KEY_ID,
    passCertificate: decodeBuffer(env.APPLE_PASS_CERT_BASE64),
    passKey: decodeBuffer(env.APPLE_PASS_KEY_BASE64),
    passTypeIdentifier: env.APPLE_PASS_TYPE_ID,
    teamIdentifier: env.APPLE_TEAM_ID,
    wwdrCertificate: decodeBuffer(env.APPLE_WWDR_CERT_BASE64),
  }
  const parsed = z
    .object({
      apnsKey: decodedValueSchema,
      apnsKeyId: z.string().min(1),
      passCertificate: z.instanceof(Buffer),
      passKey: z.instanceof(Buffer),
      passTypeIdentifier: z.string().min(1),
      teamIdentifier: z.string().min(1),
      wwdrCertificate: z.instanceof(Buffer),
    })
    .safeParse(values)
  if (!parsed.success) throw new AppleWalletConfigurationError()

  return {
    ...parsed.data,
    appUrl: env.APP_URL,
    passKeyPassphrase: env.APPLE_PASS_KEY_PASSPHRASE,
  }
}

/**
 * Decodes an optional base64 value into bytes.
 *
 * @param value - Optional base64 environment value.
 */
function decodeBuffer(value: string | undefined): Buffer | undefined {
  return value ? Buffer.from(value, 'base64') : undefined
}

/**
 * Decodes an optional base64 value into UTF-8 text.
 *
 * @param value - Optional base64 environment value.
 */
function decodeText(value: string | undefined): string | undefined {
  return value ? Buffer.from(value, 'base64').toString('utf8') : undefined
}
