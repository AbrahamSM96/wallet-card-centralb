import { env } from '@/config/env'
import { z } from 'zod'

const serviceAccountSchema = z.object({
  client_email: z.email(),
  private_key: z.string().min(1),
})

export type GoogleServiceAccount = z.infer<typeof serviceAccountSchema>

export type GoogleWalletConfig = {
  appUrl: string
  classSuffix: string
  issuerId: string
  logoUrl: string
  serviceAccount: GoogleServiceAccount
}

/** Indicates that optional Google Wallet credentials are not configured. */
export class GoogleWalletConfigurationError extends Error {
  /** Creates a stable, user-safe configuration error. */
  constructor() {
    super(
      'Google Wallet is not configured. Set credentials and an HTTPS public logo URL.'
    )
    this.name = 'GoogleWalletConfigurationError'
  }
}

/** Loads and validates Google Wallet configuration only when it is needed. */
export function getGoogleWalletConfig(): GoogleWalletConfig {
  const encodedServiceAccount = env.GOOGLE_WALLET_SERVICE_ACCOUNT_BASE64
  const issuerId = env.GOOGLE_WALLET_ISSUER_ID
  const classSuffix = env.GOOGLE_WALLET_CLASS_SUFFIX

  if (!encodedServiceAccount || !issuerId || !classSuffix) {
    throw new GoogleWalletConfigurationError()
  }

  try {
    const logoUrl = resolveGoogleWalletLogoUrl(
      env.APP_URL,
      env.GOOGLE_WALLET_LOGO_URL
    )
    const serviceAccount = serviceAccountSchema.parse(
      JSON.parse(Buffer.from(encodedServiceAccount, 'base64').toString('utf8'))
    )
    return {
      appUrl: env.APP_URL,
      classSuffix,
      issuerId,
      logoUrl,
      serviceAccount,
    }
  } catch {
    throw new GoogleWalletConfigurationError()
  }
}

/**
 * Resolves and validates the publicly downloadable Google Wallet logo.
 *
 * @param appUrl - Public application base URL.
 * @param override - Optional dedicated logo URL.
 */
export function resolveGoogleWalletLogoUrl(
  appUrl: string,
  override?: string
): string {
  const logoUrl =
    override ?? `${appUrl.replace(/\/$/, '')}/brand/google-logo.png`
  if (new URL(logoUrl).protocol !== 'https:') {
    throw new GoogleWalletConfigurationError()
  }
  return logoUrl
}
