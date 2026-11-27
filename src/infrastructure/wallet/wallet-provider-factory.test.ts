import { describe, expect, it } from 'vitest'

describe('WalletProviderFactory', () => {
  it('returns the Google adapter for the google platform', async () => {
    process.env.APP_URL = 'https://example.com'
    process.env.DATABASE_URL = 'postgres://example:example@localhost/example'
    process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-characters'
    delete process.env.APPLE_APNS_KEY_BASE64
    delete process.env.APPLE_APNS_KEY_ID
    delete process.env.APPLE_PASS_CERT_BASE64
    delete process.env.APPLE_PASS_KEY_BASE64
    delete process.env.APPLE_PASS_TYPE_ID
    delete process.env.APPLE_TEAM_ID
    delete process.env.APPLE_WWDR_CERT_BASE64
    delete process.env.GOOGLE_WALLET_CLASS_SUFFIX
    delete process.env.GOOGLE_WALLET_ISSUER_ID
    delete process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_BASE64
    const { GoogleWalletAdapter } =
      await import('./google/google-wallet-adapter')
    const { WalletProviderFactory } = await import('./wallet-provider-factory')
    expect(WalletProviderFactory.for('google')).toBeInstanceOf(
      GoogleWalletAdapter
    )
  })

  it('returns the Apple adapter for the apple platform', async () => {
    const { AppleWalletAdapter } = await import('./apple/apple-wallet-adapter')
    const { WalletProviderFactory } = await import('./wallet-provider-factory')
    expect(WalletProviderFactory.for('apple')).toBeInstanceOf(
      AppleWalletAdapter
    )
  })

  it('fails clearly when Google Wallet credentials are missing', async () => {
    const { WalletProviderFactory } = await import('./wallet-provider-factory')
    await expect(
      WalletProviderFactory.for('google').update({
        accountName: 'Test',
        appleAuthToken: null,
        birthdayPromoActive: false,
        birthdayPromoText: 'Promo de cumpleaños',
        cardId: 'card',
        platform: 'google',
        publicCode: 'CB-2345',
        referralUrl: 'https://example.com/r/CB-2345',
        rewardText: 'Reward',
        stampCount: 1,
        stampsRequired: 10,
        status: 'active',
        storeLatitude: 20,
        storeLongitude: -98,
        storeName: 'Central Brownies',
        storeRelevantText: 'Cerca de la tienda',
      })
    ).rejects.toThrow('Google Wallet is not configured')
  })

  it('fails clearly when Apple Wallet credentials are missing', async () => {
    const { WalletProviderFactory } = await import('./wallet-provider-factory')
    await expect(
      WalletProviderFactory.for('apple').issue({
        accountName: 'Test',
        appleAuthToken: 'apple-token',
        birthdayPromoActive: false,
        birthdayPromoText: 'Promo de cumpleaños',
        cardId: 'card',
        platform: 'apple',
        publicCode: 'CB-2345',
        referralUrl: 'https://example.com/r/CB-2345',
        rewardText: 'Reward',
        stampCount: 1,
        stampsRequired: 10,
        status: 'active',
        storeLatitude: 20,
        storeLongitude: -98,
        storeName: 'Central Brownies',
        storeRelevantText: 'Cerca de la tienda',
      })
    ).rejects.toThrow('Apple Wallet is not configured')
  })
})
