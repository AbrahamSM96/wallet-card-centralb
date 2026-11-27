import type {
  Card,
  CardPlatform,
  CardStatus,
  ClaimToken,
  Customer,
  LoyaltySettings,
  PendingReferral,
  StampSource,
} from './types'

export type NewCard = {
  customerId: string
  publicCode: string
  status: CardStatus
}

export type NewClaimToken = {
  cardId: string
  expiresAt: Date
  tokenHash: string
}

export type NewCustomer = {
  birthday: string
  email: string | null
  name: string
  phone: string
  privacyAcceptedAt: Date | null
}

export type NewReferral = {
  referredCustomerId: string
  referrerCardId: string
}

export type NewRedemption = {
  cardId: string
  createdAt: Date
  createdByAdminId: string
  stampsUsed: number
}

export type NewStamp = {
  cardId: string
  createdAt: Date
  createdByAdminId: string | null
  note: string | null
  orderNumber: string | null
  source: StampSource
}

export interface CardRepository {
  create(input: NewCard): Promise<Card>
  findActiveByCustomerForUpdate(customerId: string): Promise<Card | null>
  findActiveByPublicCodeForUpdate(publicCode: string): Promise<Card | null>
  findByIdForUpdate(cardId: string): Promise<Card | null>
  isPublicCodeTaken(publicCode: string): Promise<boolean>
  markClaimed(
    cardId: string,
    claimedAt: Date,
    platform: CardPlatform
  ): Promise<void>
  resetClaim(cardId: string): Promise<void>
  updateStatus(cardId: string, status: CardStatus): Promise<void>
  updateStampCount(cardId: string, stampCount: number): Promise<void>
}

export interface AppleRegistrationRepository {
  listDeviceLibraryIds(cardId: string): Promise<string[]>
  remove(cardId: string, deviceLibraryId: string): Promise<void>
  upsert(
    cardId: string,
    deviceLibraryId: string,
    pushToken: string
  ): Promise<boolean>
}

export interface ClaimTokenRepository {
  create(input: NewClaimToken): Promise<void>
  findByHashForUpdate(tokenHash: string): Promise<ClaimToken | null>
  invalidatePendingForCard(cardId: string, invalidatedAt: Date): Promise<void>
  markUsed(claimTokenId: string, usedAt: Date): Promise<void>
}

export interface CustomerRepository {
  acceptPrivacy(customerId: string, acceptedAt: Date): Promise<void>
  create(input: NewCustomer): Promise<Customer>
  getPrivacyAcceptedAt(customerId: string): Promise<Date | null>
}

export interface RedemptionRepository {
  create(input: NewRedemption): Promise<void>
}

export interface ReferralRepository {
  create(input: NewReferral): Promise<void>
  findPendingByReferredCustomerForUpdate(
    customerId: string
  ): Promise<PendingReferral | null>
  resolve(
    referralId: string,
    rewardedAt: Date,
    rewardSkippedReason: string | null
  ): Promise<boolean>
}

export interface SettingsRepository {
  get(): Promise<LoyaltySettings | null>
}

export interface StampRepository {
  create(input: NewStamp): Promise<void>
  hasOrderForCustomer(customerId: string): Promise<boolean>
  isOrderNumberTaken(orderNumber: string): Promise<boolean>
}

export type LoyaltyRepositories = {
  appleRegistrations: AppleRegistrationRepository
  cards: CardRepository
  claimTokens: ClaimTokenRepository
  customers: CustomerRepository
  redemptions: RedemptionRepository
  referrals: ReferralRepository
  settings: SettingsRepository
  stamps: StampRepository
}

export interface LoyaltyUnitOfWork {
  runInTransaction<T>(
    work: (repositories: LoyaltyRepositories) => Promise<T>
  ): Promise<T>
}
