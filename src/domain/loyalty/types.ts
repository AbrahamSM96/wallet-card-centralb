export type CardPlatform = 'apple' | 'google'
export type CardStatus = 'active' | 'flagged' | 'voided'
export type StampSource = 'manual' | 'order' | 'referral_bonus'

export type Card = {
  claimedAt: Date | null
  customerId: string
  id: string
  platform: CardPlatform | null
  publicCode: string
  stampCount: number
  status: CardStatus
}

export type ClaimToken = {
  cardId: string
  expiresAt: Date
  id: string
  invalidatedAt: Date | null
  usedAt: Date | null
}

export type PendingReferral = {
  id: string
  referrerCardId: string
}

export type LoyaltySettings = {
  stampsRequired: number
}

export type Customer = {
  id: string
}
