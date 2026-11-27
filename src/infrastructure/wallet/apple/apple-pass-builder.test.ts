import type { WalletCard } from '@/domain/loyalty/wallet-provider'
import { describe, expect, it } from 'vitest'

import { ApplePassBuilder } from './apple-pass-builder'

const card: WalletCard = {
  accountName: 'Cliente Prueba',
  appleAuthToken: 'apple-auth-token',
  birthdayPromoActive: false,
  birthdayPromoText: 'Promo de cumpleaños',
  cardId: 'card-id',
  platform: 'apple',
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

describe('ApplePassBuilder', () => {
  it('builds a current storeCard pass with change messages and location', () => {
    const pass = new ApplePassBuilder({
      appUrl: 'https://example.com',
      card,
      passTypeIdentifier: 'pass.com.example.central',
      teamIdentifier: 'TEAM123456',
    }).build()

    expect(pass).toMatchObject({
      authenticationToken: 'apple-auth-token',
      locations: [
        {
          latitude: card.storeLatitude,
          longitude: card.storeLongitude,
        },
      ],
      passTypeIdentifier: 'pass.com.example.central',
      serialNumber: 'card-id',
      storeCard: {
        primaryFields: [
          expect.objectContaining({
            changeMessage: 'Tus sellos ahora son %@.',
            value: '4/10',
          }),
        ],
        secondaryFields: [
          expect.objectContaining({ changeMessage: 'Nueva promoción: %@' }),
        ],
      },
      webServiceURL: 'https://example.com/api/apple',
    })
    expect(pass).not.toHaveProperty('relevantDate')
    expect(pass).not.toHaveProperty('relevantDates')
  })

  it('marks voided cards in pass.json', () => {
    const pass = new ApplePassBuilder({
      appUrl: 'https://example.com',
      card: { ...card, status: 'voided' },
      passTypeIdentifier: 'pass.com.example.central',
      teamIdentifier: 'TEAM123456',
    }).build()
    expect(pass.voided).toBe(true)
  })
})
