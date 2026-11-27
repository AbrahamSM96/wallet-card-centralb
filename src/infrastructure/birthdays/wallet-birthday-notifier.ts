import type { BirthdayNotifier } from '@/domain/birthdays/birthday-service'
import { WalletSyncService } from '@/infrastructure/wallet/wallet-sync-service'

/** Applies and removes birthday presentation through wallet adapters. */
export class WalletBirthdayNotifier implements BirthdayNotifier {
  readonly #walletSync: WalletSyncService

  /**
   * Creates the notifier around the wallet synchronization service.
   *
   * @param walletSync - Wallet synchronization service.
   */
  constructor(walletSync: WalletSyncService = new WalletSyncService()) {
    this.#walletSync = walletSync
  }

  /**
   * Removes expired birthday presentation from a wallet object.
   *
   * @param cardId - Card identifier.
   */
  async clear(cardId: string): Promise<void> {
    await this.#walletSync.update(cardId)
  }

  /**
   * Updates the pass and sends the provider-specific birthday message.
   *
   * @param cardId - Card identifier.
   * @param message - Configured birthday promotion.
   * @param year - Local birthday year used in the message ID.
   */
  async notify(cardId: string, message: string, year: number): Promise<void> {
    await this.#walletSync.update(cardId)
    await this.#walletSync.notify(cardId, {
      body: message,
      header: '¡Feliz cumpleaños!',
      id: `birthday-${year}`,
    })
  }
}
