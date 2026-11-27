import type {
  WalletCard,
  WalletIssueResult,
  WalletNotification,
  WalletProvider,
} from '@/domain/loyalty/wallet-provider'

import {
  type GoogleLoyaltyClass,
  type GoogleLoyaltyObject,
  GoogleLoyaltyObjectBuilder,
} from './google-loyalty-object-builder'
import { createGoogleWalletApiError } from './google-wallet-api-error'
import { GoogleWalletAuthClient } from './google-wallet-auth-client'
import {
  getGoogleWalletConfig,
  type GoogleWalletConfig,
} from './google-wallet-config'

const API_BASE_URL = 'https://walletobjects.googleapis.com/walletobjects/v1'
const MAX_MESSAGES = 10
const MAX_NOTIFICATIONS_PER_DAY = 3
const ONE_DAY_MS = 24 * 60 * 60 * 1000

type GoogleMessage = {
  body?: string
  header?: string
  id?: string
  messageType?: string
}

type GoogleObjectResponse = GoogleLoyaltyObject & {
  messages?: GoogleMessage[]
}

type GoogleWalletAdapterDependencies = {
  authClient?: GoogleWalletAuthClient
  config?: GoogleWalletConfig
  fetcher?: typeof fetch
}

/** Implements Google Wallet loyalty issuance, updates, and messages. */
export class GoogleWalletAdapter implements WalletProvider {
  #authClient: GoogleWalletAuthClient | null
  #config: GoogleWalletConfig | null
  readonly #fetcher: typeof fetch

  /**
   * Creates a lazy-configured adapter with injectable test dependencies.
   *
   * @param dependencies - Optional configuration, auth, and fetch overrides.
   * @param dependencies.authClient - Google auth singleton override.
   * @param dependencies.config - Validated configuration override.
   * @param dependencies.fetcher - HTTP implementation override.
   */
  constructor(dependencies: GoogleWalletAdapterDependencies = {}) {
    this.#config = dependencies.config ?? null
    this.#authClient = dependencies.authClient ?? null
    this.#fetcher = dependencies.fetcher ?? fetch
  }

  /**
   * Creates or updates the pass resources and signs an Add to Wallet URL.
   *
   * @param card - Trusted card presentation data.
   */
  async issue(card: WalletCard): Promise<WalletIssueResult> {
    const builder = this.#builder(card)
    await this.#ensureClass(builder.buildClass())
    await this.#upsertObject(builder.buildObject())
    const config = this.#configuration()
    const signedJwt = await this.#authentication().signSaveJwt(
      {
        loyaltyObjects: [
          {
            classId: this.#classId(),
            id: builder.objectId(),
          },
        ],
      },
      [new URL(config.appUrl).hostname]
    )
    return { saveUrl: `https://pay.google.com/gp/v/save/${signedJwt}` }
  }

  /**
   * Adds a pass message and uses TEXT when the 24-hour notify limit is met.
   *
   * @param card - Trusted card presentation data.
   * @param notification - Message content.
   */
  async notify(
    card: WalletCard,
    notification: WalletNotification
  ): Promise<void> {
    const builder = this.#builder(card)
    const object = await this.#getObject(builder.objectId())
    const messages = object.messages ?? []
    const recentNotifications = messages.filter((message) =>
      isRecentNotification(message)
    ).length

    if (messages.length >= MAX_MESSAGES) {
      await this.#request(
        `/loyaltyObject/${encodeURIComponent(builder.objectId())}`,
        {
          body: JSON.stringify({
            messages: messages.slice(-(MAX_MESSAGES - 1)),
          }),
          method: 'PATCH',
        }
      )
    }

    const messageType =
      recentNotifications >= MAX_NOTIFICATIONS_PER_DAY
        ? 'TEXT'
        : 'TEXT_AND_NOTIFY'
    await this.#request(
      `/loyaltyObject/${encodeURIComponent(builder.objectId())}/addMessage`,
      {
        body: JSON.stringify({
          message: {
            body: notification.body,
            header: notification.header,
            id: `${notification.id}-${Date.now()}`,
            messageType,
          },
        }),
        method: 'POST',
      }
    )
  }

  /**
   * Patches stamps, links, texts, and the supported merchant location.
   *
   * @param card - Trusted card presentation data.
   */
  async update(card: WalletCard): Promise<void> {
    const loyaltyObject = this.#builder(card).buildObject()
    await this.#request(
      `/loyaltyObject/${encodeURIComponent(loyaltyObject.id)}`,
      {
        body: JSON.stringify({
          ...loyaltyObject,
          notifyPreference: 'DO_NOT_NOTIFY',
        }),
        method: 'PATCH',
      }
    )
  }

  /**
   * Patches shared class presentation after settings change.
   *
   * @param card - One trusted card carrying current store settings.
   */
  async updateClass(card: WalletCard): Promise<void> {
    const loyaltyClass = this.#builder(card).buildClass()
    await this.#request(
      `/loyaltyClass/${encodeURIComponent(loyaltyClass.id)}`,
      {
        body: JSON.stringify(loyaltyClass),
        method: 'PATCH',
      }
    )
  }

  /**
   * Builds resources using the configured issuer and class.
   *
   * @param card - Trusted card presentation data.
   */
  #builder(card: WalletCard): GoogleLoyaltyObjectBuilder {
    const config = this.#configuration()
    return new GoogleLoyaltyObjectBuilder({
      card,
      classId: this.#classId(),
      issuerId: config.issuerId,
      logoUrl: config.logoUrl,
      stripBaseUrl: config.appUrl,
    })
  }

  /** Returns the issuer-qualified class ID. */
  #classId(): string {
    const config = this.#configuration()
    return `${config.issuerId}.${config.classSuffix}`
  }

  /** Returns the lazy auth singleton after configuration is validated. */
  #authentication(): GoogleWalletAuthClient {
    this.#authClient ??= GoogleWalletAuthClient.for(
      this.#configuration().serviceAccount
    )
    return this.#authClient
  }

  /** Loads optional environment configuration on first adapter operation. */
  #configuration(): GoogleWalletConfig {
    this.#config ??= getGoogleWalletConfig()
    return this.#config
  }

  /**
   * Creates the class if Google does not have it yet.
   *
   * @param loyaltyClass - Current class resource.
   */
  async #ensureClass(loyaltyClass: GoogleLoyaltyClass): Promise<void> {
    const response = await this.#request(
      `/loyaltyClass/${encodeURIComponent(loyaltyClass.id)}`,
      { allowNotFound: true }
    )
    if (response === null) {
      await this.#request('/loyaltyClass', {
        body: JSON.stringify(loyaltyClass),
        method: 'POST',
      })
      return
    }
    await this.#request(
      `/loyaltyClass/${encodeURIComponent(loyaltyClass.id)}`,
      {
        body: JSON.stringify(loyaltyClass),
        method: 'PATCH',
      }
    )
  }

  /**
   * Fetches an existing loyalty object including message history.
   *
   * @param objectId - Issuer-qualified object identifier.
   */
  async #getObject(objectId: string): Promise<GoogleObjectResponse> {
    const response = await this.#request(
      `/loyaltyObject/${encodeURIComponent(objectId)}`
    )
    return response as GoogleObjectResponse
  }

  /**
   * Inserts a missing object or patches its current presentation.
   *
   * @param loyaltyObject - Current object resource.
   */
  async #upsertObject(loyaltyObject: GoogleLoyaltyObject): Promise<void> {
    const response = await this.#request(
      `/loyaltyObject/${encodeURIComponent(loyaltyObject.id)}`,
      { allowNotFound: true }
    )
    if (response === null) {
      await this.#request('/loyaltyObject', {
        body: JSON.stringify(loyaltyObject),
        method: 'POST',
      })
      return
    }
    await this.#request(
      `/loyaltyObject/${encodeURIComponent(loyaltyObject.id)}`,
      {
        body: JSON.stringify(loyaltyObject),
        method: 'PATCH',
      }
    )
  }

  /**
   * Performs one authenticated Google Wallet REST request.
   *
   * @param path - REST path relative to the Wallet Objects endpoint.
   * @param options - Fetch options and optional 404 handling.
   */
  async #request(
    path: string,
    options: RequestInit & { allowNotFound?: boolean } = {}
  ): Promise<unknown> {
    const accessToken = await this.#authentication().getAccessToken()
    const { allowNotFound, ...requestOptions } = options
    const headers = new Headers(requestOptions.headers)
    headers.set('Authorization', `Bearer ${accessToken}`)
    headers.set('Content-Type', 'application/json')
    const response = await this.#fetcher(`${API_BASE_URL}${path}`, {
      ...requestOptions,
      headers,
      signal: AbortSignal.timeout(10_000),
    })
    if (response.status === 404 && allowNotFound) return null
    if (!response.ok) {
      throw createGoogleWalletApiError(response.status, await response.text())
    }
    return response.status === 204 ? {} : response.json()
  }
}

/**
 * Detects adapter-authored notified messages within Google's 24-hour window.
 *
 * @param message - Message returned by the Wallet Objects API.
 */
function isRecentNotification(message: GoogleMessage): boolean {
  if (message.messageType !== 'TEXT_AND_NOTIFY' || !message.id) return false
  const timestamp = Number(message.id.split('-').at(-1))
  return Number.isFinite(timestamp) && Date.now() - timestamp < ONE_DAY_MS
}
