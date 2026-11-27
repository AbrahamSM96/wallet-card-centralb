import type {
  LoyaltyLogger,
  PostCommitScheduler,
  WalletSync,
} from '@/domain/loyalty/wallet-provider'
import type { SettingsWalletCard } from '@/infrastructure/db/admin-dashboard'
import { scheduleAfterResponse } from '@/infrastructure/next-after-scheduler'
import { ServerLogger } from '@/infrastructure/server-logger'

import { WalletSyncService } from './wallet-sync-service'

type SettingsWalletSyncDependencies = {
  logger?: LoyaltyLogger
  scheduler?: PostCommitScheduler
  walletSync?: WalletSync
}

/**
 * Schedules a simple sequential refresh after settings are committed.
 *
 * @param cards - Claimed, non-voided cards touched by the settings update.
 * @param dependencies - Optional scheduler, sync service, and logger overrides.
 * @param dependencies.logger - Recoverable failure logger.
 * @param dependencies.scheduler - Post-response scheduler.
 * @param dependencies.walletSync - Wallet synchronizer.
 */
export async function scheduleSettingsWalletSync(
  cards: SettingsWalletCard[],
  dependencies: SettingsWalletSyncDependencies = {}
): Promise<void> {
  const logger = dependencies.logger ?? new ServerLogger()
  const scheduler = dependencies.scheduler ?? scheduleAfterResponse
  const walletSync = dependencies.walletSync ?? new WalletSyncService()

  await scheduler(async () => {
    let googleClassCardId: string | null = null

    for (const card of cards) {
      try {
        await walletSync.update(card.id)
        if (card.platform === 'google' && !googleClassCardId) {
          googleClassCardId = card.id
        }
      } catch (error) {
        logger.error('Wallet settings synchronization failed', error)
      }
    }

    if (googleClassCardId) {
      try {
        await walletSync.updateClass(googleClassCardId)
      } catch (error) {
        logger.error('Google Wallet class synchronization failed', error)
      }
    }
  })
}
