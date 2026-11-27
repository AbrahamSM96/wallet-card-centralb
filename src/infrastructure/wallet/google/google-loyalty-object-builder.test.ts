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
      stripBaseUrl: 'https://example.com',
    })
    const loyaltyClass = builder.buildClass()
    const loyaltyObject = builder.buildObject()

    expect(loyaltyClass).toMatchObject({
      hexBackgroundColor: '#141110',
      id: 'issuer.loyalty',
      merchantLocations: [
        {
          latitude: card.storeLatitude,
          longitude: card.storeLongitude,
        },
      ],
      multipleDevicesAndHoldersAllowedStatus: 'ONE_USER_ALL_DEVICES',
      programLogo: {
        sourceUri: { uri: 'https://cdn.example.com/logo.png' },
      },
      programName: 'Central Brownies',
    })
    expect(loyaltyObject).toMatchObject({
      accountId: 'CB-2345',
      classId: 'issuer.loyalty',
      heroImage: {
        sourceUri: {
          uri: 'https://example.com/api/wallet/strip?stamps=4&goal=10',
        },
      },
      id: 'issuer.card-id',
      linksModuleData: {
        uris: [{ uri: card.referralUrl }],
      },
      loyaltyPoints: { balance: { string: '4 de 10' }, label: 'Sellos' },
      merchantLocations: [
        {
          latitude: card.storeLatitude,
          longitude: card.storeLongitude,
        },
      ],
      secondaryLoyaltyPoints: {
        balance: { string: '6' },
        label: 'Te faltan',
      },
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
      stripBaseUrl: 'https://example.com',
    })

    expect(builder.buildObject().state).toBe('INACTIVE')
  })

  it('switches secondary points to the ready reward state', () => {
    const builder = new GoogleLoyaltyObjectBuilder({
      card: { ...card, stampCount: 10 },
      classId: 'issuer.loyalty',
      issuerId: 'issuer',
      logoUrl: 'https://cdn.example.com/logo.png',
      stripBaseUrl: 'https://example.com',
    })

    expect(builder.buildObject().secondaryLoyaltyPoints).toEqual({
      balance: { string: 'Listo' },
      label: 'Premio',
    })
  })
})
