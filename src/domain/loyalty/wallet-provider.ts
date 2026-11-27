import type { CardPlatform } from './types'
import type { CardStatus } from './types'

export type PostCommitScheduler = (task: () => Promise<void>) => Promise<void>

export type WalletCard = {
  accountName: string
  appleAuthToken: string | null
  birthdayPromoActive: boolean
  birthdayPromoText: string
  cardId: string
  platform: CardPlatform | null
  publicCode: string
  referralUrl: string
  rewardText: string
  stampCount: number
  stampsRequired: number
  status: CardStatus
  storeLatitude: number
  storeLongitude: number
  storeName: string
  storeRelevantText: string
}

export type WalletIssueResult = {
  passData?: Uint8Array
  saveUrl?: string
}

export type WalletNotification = {
  body: string
  header: string
  id: string
}

export interface WalletProvider {
  issue(card: WalletCard): Promise<WalletIssueResult>
  notify(card: WalletCard, notification: WalletNotification): Promise<void>
  update(card: WalletCard): Promise<void>
  updateClass?(card: WalletCard): Promise<void>
}

export interface WalletSync {
  issue(cardId: string, platform: CardPlatform): Promise<WalletIssueResult>
  notify(cardId: string, notification: WalletNotification): Promise<void>
  update(cardId: string): Promise<void>
  updateClass(cardId: string): Promise<void>
}

export interface LoyaltyLogger {
  error(message: string, error: unknown): void
}
