import type { WalletCard } from '@/domain/loyalty/wallet-provider'
import { describe, expect, it } from 'vitest'

import { GoogleLoyaltyObjectBuilder } from './google-loyalty-object-builder'

const card: WalletCard = {
  accountName: 'Cliente Prueba',
  appleAuthToken: null,
  birthdayPromoActive: false,
  birthdayPromoText: 'Promo de cumpleaños',
  cardId: 'card-id',
  platform: 'google',
  publicCode: 'CB-2345',
  referralUrl: 'https://example.com/r/CB-2345',
  rewardText: 'Brownie de regalo',
  stampCount: 4,
  stampsRequired: 10,
  status: 'active',
  storeLatitude: 20.116710019053915,
  storeLongitude: -98.74697712947373,
  storeName: 'Central Brownies',
  storeRelevantText: 'Estás cerca de Central Brownies',
}

describe('GoogleLoyaltyObjectBuilder', () => {
  it('builds supported loyalty fields and merchant locations', () => {
    const builder = new GoogleLoyaltyObjectBuilder({
      card,
      classId: 'issuer.loyalty',
      issuerId: 'issuer',
      logoUrl: 'https://cdn.example.com/logo.png',
    })
    const loyaltyClass = builder.buildClass()
    const loyaltyObject = builder.buildObject()

    expect(loyaltyClass).toMatchObject({
      id: 'issuer.loyalty',
      merchantLocations: [
        {
          latitude: card.storeLatitude,
          longitude: card.storeLongitude,
        },
      ],
      multipleDevicesAndHoldersAllowedStatus: 'ONE_USER_ALL_DEVICES',
    })
    expect(loyaltyObject).toMatchObject({
      accountId: 'CB-2345',
      classId: 'issuer.loyalty',
      id: 'issuer.card-id',
      linksModuleData: {
        uris: [{ uri: card.referralUrl }],
      },
      loyaltyPoints: { balance: { int: 4 }, label: 'Sellos' },
      merchantLocations: [
        {
          latitude: card.storeLatitude,
          longitude: card.storeLongitude,
        },
      ],
      state: 'ACTIVE',
    })
    expect(loyaltyObject).not.toHaveProperty('locations')
  })

  it('marks a voided card inactive', () => {
    const builder = new GoogleLoyaltyObjectBuilder({
      card: { ...card, status: 'voided' },
      classId: 'issuer.loyalty',
      issuerId: 'issuer',
      logoUrl: 'https://cdn.example.com/logo.png',
    })

    expect(builder.buildObject().state).toBe('INACTIVE')
  })
})
