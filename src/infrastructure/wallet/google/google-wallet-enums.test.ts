import type { WalletCard } from '@/domain/loyalty/wallet-provider'
import { describe, expect, it } from 'vitest'

import { GoogleLoyaltyObjectBuilder } from './google-loyalty-object-builder'
import {
  GOOGLE_BARCODE_TYPES,
  GOOGLE_MESSAGE_TYPES,
  GOOGLE_MULTIPLE_HOLDER_STATUSES,
  GOOGLE_NOTIFICATION_SETTINGS,
  GOOGLE_OBJECT_STATES,
  GOOGLE_REVIEW_STATUSES,
  selectGoogleMessageType,
} from './google-wallet-enums'

const card: WalletCard = {
  accountName: 'Cliente',
  appleAuthToken: null,
  birthdayPromoActive: false,
  birthdayPromoText: 'Promo',
  cardId: 'card',
  platform: 'google',
  publicCode: 'CB-2345',
  referralUrl: 'https://example.com/r/CB-2345',
  rewardText: 'Brownie de regalo',
  stampCount: 3,
  stampsRequired: 10,
  status: 'active',
  storeLatitude: 20,
  storeLongitude: -98,
  storeName: 'Central Brownies',
  storeRelevantText: 'Cerca',
}

describe('Google Wallet enums', () => {
  it('only emits enum values listed by the REST reference', () => {
    const builder = new GoogleLoyaltyObjectBuilder({
      card,
      classId: 'issuer.class',
      issuerId: 'issuer',
      logoUrl: 'https://example.com/logo.png',
      stripBaseUrl: 'https://example.com',
    })
    const loyaltyClass = builder.buildClass()
    const loyaltyObject = builder.buildObject()

    expect(GOOGLE_REVIEW_STATUSES).toContain(loyaltyClass.reviewStatus)
    expect(GOOGLE_MULTIPLE_HOLDER_STATUSES).toContain(
      loyaltyClass.multipleDevicesAndHoldersAllowedStatus
    )
    expect(GOOGLE_OBJECT_STATES).toContain(loyaltyObject.state)
    expect(GOOGLE_BARCODE_TYPES).toContain(loyaltyObject.barcode.type)
    expect(GOOGLE_MESSAGE_TYPES).toContain(selectGoogleMessageType(0))
    expect(GOOGLE_MESSAGE_TYPES).toContain(selectGoogleMessageType(3))
    expect(GOOGLE_NOTIFICATION_SETTINGS).not.toContain('DO_NOT_NOTIFY')
  })
})
