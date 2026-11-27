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
      backgroundColor: 'rgb(20, 17, 16)',
      foregroundColor: 'rgb(255, 255, 255)',
      labelColor: 'rgb(224, 165, 102)',
      locations: [
        {
          latitude: card.storeLatitude,
          longitude: card.storeLongitude,
        },
      ],
      logoText: 'Central Brownies',
      passTypeIdentifier: 'pass.com.example.central',
      serialNumber: 'card-id',
      storeCard: {
        headerFields: [
          expect.objectContaining({
            changeMessage: '¡Un brownie más! Llevas %@.',
            value: '4/10',
          }),
        ],
        secondaryFields: [
          expect.objectContaining({
            label: 'CLIENTE',
            value: 'Cliente Prueba',
          }),
          expect.objectContaining({
            label: 'PREMIO',
            value: 'Brownie de regalo',
          }),
        ],
      },
      webServiceURL: 'https://example.com/api/apple',
    })
    expect(pass.storeCard).not.toHaveProperty('primaryFields')
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

  it('switches the reward field when the goal is complete', () => {
    const pass = new ApplePassBuilder({
      appUrl: 'https://example.com',
      card: { ...card, stampCount: 10 },
      passTypeIdentifier: 'pass.com.example.central',
      teamIdentifier: 'TEAM123456',
    }).build()
    expect(pass.storeCard.secondaryFields[1]).toEqual({
      changeMessage: '%@: tu brownie de regalo te espera.',
      key: 'reward',
      label: 'PREMIO',
      value: 'Listo para canjear',
    })
  })

  it('replaces the reward field during the birthday window', () => {
    const pass = new ApplePassBuilder({
      appUrl: 'https://example.com',
      card: { ...card, birthdayPromoActive: true },
      passTypeIdentifier: 'pass.com.example.central',
      teamIdentifier: 'TEAM123456',
    }).build()
    expect(pass.storeCard.secondaryFields[1]).toEqual({
      changeMessage: '¡Feliz cumple! %@ esta semana.',
      key: 'birthday_promotion',
      label: 'CUMPLEAÑOS',
      value: 'Promo especial',
    })
  })
})
