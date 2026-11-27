import type {
  WalletCard,
  WalletIssueResult,
  WalletNotification,
  WalletProvider,
} from '@/domain/loyalty/wallet-provider'

import { AppleApnsClient } from './apple-apns-client'
import { ApplePassBuilder } from './apple-pass-builder'
import { ApplePassSigningClient } from './apple-pass-signing-client'
import {
  type AppleWalletConfig,
  getAppleWalletConfig,
} from './apple-wallet-config'
import { listApplePushTokens } from './apple-web-service-repository'

type AppleWalletAdapterDependencies = {
  apnsClient?: AppleApnsClient
  config?: AppleWalletConfig
  signingClient?: ApplePassSigningClient
}

/** Implements Apple Wallet pass signing and APNs update notifications. */
export class AppleWalletAdapter implements WalletProvider {
  #apnsClient: AppleApnsClient | null
  #config: AppleWalletConfig | null
  #signingClient: ApplePassSigningClient | null

  /**
   * Creates a lazy-configured Apple adapter.
   *
   * @param dependencies - Optional configuration and singleton overrides.
   * @param dependencies.apnsClient - APNs client override.
   * @param dependencies.config - Apple configuration override.
   * @param dependencies.signingClient - Pass signer override.
   */
  constructor(dependencies: AppleWalletAdapterDependencies = {}) {
    this.#apnsClient = dependencies.apnsClient ?? null
    this.#config = dependencies.config ?? null
    this.#signingClient = dependencies.signingClient ?? null
  }

  /**
   * Builds and signs one `.pkpass` package.
   *
   * @param card - Trusted card presentation data.
   */
  async issue(card: WalletCard): Promise<WalletIssueResult> {
    try {
      const config = this.#configuration()
      const passJson = new ApplePassBuilder({
        appUrl: config.appUrl,
        card,
        passTypeIdentifier: config.passTypeIdentifier,
        teamIdentifier: config.teamIdentifier,
      }).build()
      const passData = await this.#signer().sign(passJson)
      return { passData }
    } catch (error) {
      throw error instanceof Error
        ? error
        : new Error('Apple pass generation failed')
    }
  }

  /**
   * Sends an empty APNs push for every device registered to the pass.
   *
   * @param _card - Trusted card presentation data; update already sent the push.
   * @param _notification - Message represented through pass changeMessage.
   */
  notify(_card: WalletCard, _notification: WalletNotification): Promise<void> {
    this.#configuration()
    return Promise.resolve()
  }

  /**
   * Signals registered devices to fetch a newly signed pass.
   *
   * @param card - Trusted card presentation data.
   */
  async update(card: WalletCard): Promise<void> {
    const pushTokens = await listApplePushTokens(card.cardId)
    await Promise.all(
      pushTokens.map((pushToken) => this.#apns().sendPassUpdate(pushToken))
    )
  }

  /** Returns the lazy process-wide APNs client. */
  #apns(): AppleApnsClient {
    this.#apnsClient ??= AppleApnsClient.for(this.#configuration())
    return this.#apnsClient
  }

  /** Loads optional environment configuration on first operation. */
  #configuration(): AppleWalletConfig {
    this.#config ??= getAppleWalletConfig()
    return this.#config
  }

  /** Returns the lazy process-wide pass signing client. */
  #signer(): ApplePassSigningClient {
    this.#signingClient ??= ApplePassSigningClient.for(this.#configuration())
    return this.#signingClient
  }
}
