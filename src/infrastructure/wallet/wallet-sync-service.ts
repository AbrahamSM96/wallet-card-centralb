import type { CardPlatform } from '@/domain/loyalty/types'
import type {
  WalletIssueResult,
  WalletNotification,
  WalletSync,
} from '@/domain/loyalty/wallet-provider'

import { ensureAppleAuthToken, getWalletCard } from './wallet-card-query'
import { WalletProviderFactory } from './wallet-provider-factory'

/** Coordinates trusted database data with the selected wallet adapter. */
export class WalletSyncService implements WalletSync {
  readonly #factory: typeof WalletProviderFactory
  readonly #getCard: typeof getWalletCard

  /**
   * Creates the synchronizer with replaceable data and factory collaborators.
   *
   * @param getCard - Trusted wallet-card data loader.
   * @param factory - Wallet provider factory.
   */
  constructor(
    getCard: typeof getWalletCard = getWalletCard,
    factory: typeof WalletProviderFactory = WalletProviderFactory
  ) {
    this.#factory = factory
    this.#getCard = getCard
  }

  /**
   * Issues a wallet object and returns its save URL.
   *
   * @param cardId - Card identifier.
   * @param platform - Selected wallet platform.
   */
  async issue(
    cardId: string,
    platform: CardPlatform
  ): Promise<WalletIssueResult> {
    if (platform === 'apple') await ensureAppleAuthToken(cardId)
    const card = await requireWalletCard(this.#getCard, cardId)
    return this.#factory.for(platform).issue(card)
  }

  /**
   * Sends a message only for a card already claimed on a wallet platform.
   *
   * @param cardId - Card identifier.
   * @param notification - Message content.
   */
  async notify(
    cardId: string,
    notification: WalletNotification
  ): Promise<void> {
    const card = await requireWalletCard(this.#getCard, cardId)
    if (!card.platform) return
    await this.#factory.for(card.platform).notify(card, notification)
  }

  /**
   * Updates a card only after it has been claimed on a wallet platform.
   *
   * @param cardId - Card identifier.
   */
  async update(cardId: string): Promise<void> {
    const card = await requireWalletCard(this.#getCard, cardId)
    if (!card.platform) return
    await this.#factory.for(card.platform).update(card)
  }

  /**
   * Updates shared provider class data when the provider supports it.
   *
   * @param cardId - Representative claimed card identifier.
   */
  async updateClass(cardId: string): Promise<void> {
    const card = await requireWalletCard(this.#getCard, cardId)
    if (!card.platform) return
    const provider = this.#factory.for(card.platform)
    if (provider.updateClass) await provider.updateClass(card)
  }
}

/**
 * Loads wallet data or fails with a stable internal error.
 *
 * @param getCard - Trusted wallet-card data loader.
 * @param cardId - Card identifier.
 */
async function requireWalletCard(
  getCard: typeof getWalletCard,
  cardId: string
): Promise<NonNullable<Awaited<ReturnType<typeof getWalletCard>>>> {
  const card = await getCard(cardId)
  if (!card) throw new Error('Wallet card data was not found')
  return card
}
