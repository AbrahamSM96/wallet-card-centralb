import { type ClientHttp2Session, connect } from 'node:http2'

import { importPKCS8, SignJWT } from 'jose'

import type { AppleWalletConfig } from './apple-wallet-config'

const APNS_ORIGIN = 'https://api.push.apple.com'
const TOKEN_LIFETIME_MS = 50 * 60 * 1000

/** Reuses the APNs HTTP/2 session, signing key, and provider token. */
export class AppleApnsClient {
  static #instance: AppleApnsClient | null = null

  readonly #config: AppleWalletConfig
  readonly #privateKey: Promise<CryptoKey>
  #providerToken: { createdAt: number; value: string } | null = null
  #session: ClientHttp2Session | null = null

  /**
   * Returns the process-wide APNs client singleton.
   *
   * @param config - Validated Apple Wallet configuration.
   */
  static for(config: AppleWalletConfig): AppleApnsClient {
    AppleApnsClient.#instance ??= new AppleApnsClient(config)
    return AppleApnsClient.#instance
  }

  /**
   * Imports the APNs `.p8` key once.
   *
   * @param config - Validated Apple Wallet configuration.
   */
  private constructor(config: AppleWalletConfig) {
    this.#config = config
    this.#privateKey = importPKCS8(config.apnsKey, 'ES256')
  }

  /**
   * Sends Apple's required empty pass-update push.
   *
   * @param pushToken - Device push token registered by Wallet.
   */
  async sendPassUpdate(pushToken: string): Promise<void> {
    const session = this.#connection()
    const authorization = `bearer ${await this.#token()}`

    await new Promise<void>((resolve, reject) => {
      const request = session.request({
        ':method': 'POST',
        ':path': `/3/device/${pushToken}`,
        'apns-priority': '5',
        'apns-topic': this.#config.passTypeIdentifier,
        authorization,
      })
      let status = 0
      request.on('response', (headers) => {
        status = Number(headers[':status'] ?? 0)
      })
      request.on('error', reject)
      request.on('end', () => {
        if (status >= 200 && status < 300) resolve()
        else reject(new Error(`APNs pass update failed with ${status}`))
      })
      request.resume()
      request.end('{}')
    })
  }

  /** Returns or creates the shared production APNs HTTP/2 session. */
  #connection(): ClientHttp2Session {
    if (!this.#session || this.#session.closed || this.#session.destroyed) {
      this.#session = connect(APNS_ORIGIN)
    }
    return this.#session
  }

  /** Returns a provider token no older than Apple's one-hour limit. */
  async #token(): Promise<string> {
    const now = Date.now()
    if (
      this.#providerToken &&
      now - this.#providerToken.createdAt < TOKEN_LIFETIME_MS
    ) {
      return this.#providerToken.value
    }

    const value = await new SignJWT({})
      .setIssuedAt()
      .setIssuer(this.#config.teamIdentifier)
      .setProtectedHeader({ alg: 'ES256', kid: this.#config.apnsKeyId })
      .sign(await this.#privateKey)
    this.#providerToken = { createdAt: now, value }
    return value
  }
}
