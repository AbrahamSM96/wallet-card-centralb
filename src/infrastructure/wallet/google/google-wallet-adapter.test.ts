import type { WalletCard } from '@/domain/loyalty/wallet-provider'
import { describe, expect, it, vi } from 'vitest'

import type { GoogleWalletAuthClient } from './google-wallet-auth-client'
import type { GoogleWalletConfig } from './google-wallet-config'

const card: WalletCard = {
  accountName: 'Cliente Prueba',
  appleAuthToken: null,
  birthdayPromoActive: false,
  birthdayPromoText: 'Promo especial',
  cardId: 'card-id',
  platform: 'google',
  publicCode: 'CB-2345',
  referralUrl: 'https://example.com/r/CB-2345',
  rewardText: 'Brownie de regalo',
  stampCount: 7,
  stampsRequired: 10,
  status: 'active',
  storeLatitude: 20.1167,
  storeLongitude: -98.7469,
  storeName: 'Central Brownies',
  storeRelevantText: 'Estás a unos pasos.',
}

describe('GoogleWalletAdapter', () => {
  it('patches an existing loyalty class before issuing', async () => {
    process.env.APP_URL = 'https://example.com'
    process.env.DATABASE_URL = 'postgres://example:example@localhost/example'
    process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-characters'
    const { GoogleWalletAdapter } = await import('./google-wallet-adapter')
    const requests: Array<{ method: string; url: string }> = []
    const fetchImplementation = (
      input: string | URL | Request,
      init?: RequestInit
    ): Promise<Response> => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url
      const method = init?.method ?? 'GET'
      requests.push({ method, url })
      if (url.includes('/loyaltyObject/') && method === 'GET') {
        return Promise.resolve(new Response('{}', { status: 404 }))
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    }
    const fetcher = fetchImplementation as unknown as typeof fetch
    const authClient = {
      getAccessToken: vi.fn().mockResolvedValue('access-token'),
      signSaveJwt: vi.fn().mockResolvedValue('signed-jwt'),
    } as unknown as GoogleWalletAuthClient
    const config: GoogleWalletConfig = {
      appUrl: 'https://example.com',
      classSuffix: 'loyalty',
      issuerId: 'issuer',
      logoUrl: 'https://example.com/brand/google-logo.png',
      serviceAccount: {
        client_email: 'wallet@example.iam.gserviceaccount.com',
        private_key: 'unused-test-key',
      },
    }
    const adapter = new GoogleWalletAdapter({
      authClient,
      config,
      fetcher,
    })

    await expect(adapter.issue(card)).resolves.toEqual({
      saveUrl: 'https://pay.google.com/gp/v/save/signed-jwt',
    })
    expect(requests).toContainEqual({
      method: 'PATCH',
      url: 'https://walletobjects.googleapis.com/walletobjects/v1/loyaltyClass/issuer.loyalty',
    })
  })
})
