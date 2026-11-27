import type { CardPlatform } from '@/domain/loyalty/types'
import type { WalletProvider } from '@/domain/loyalty/wallet-provider'
import { AppleWalletAdapter } from '@/infrastructure/wallet/apple/apple-wallet-adapter'
import { GoogleWalletAdapter } from '@/infrastructure/wallet/google/google-wallet-adapter'

/** Selects a concrete wallet adapter without exposing it to the domain. */
export class WalletProviderFactory {
  /**
   * Returns the adapter for a wallet platform.
   *
   * @param platform - Requested wallet platform.
   */
  static for(platform: CardPlatform): WalletProvider {
    if (platform === 'google') return new GoogleWalletAdapter()
    return new AppleWalletAdapter()
  }
}
