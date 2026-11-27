import { describe, expect, it } from 'vitest'

describe('resolveGoogleWalletLogoUrl', () => {
  it('prefers a dedicated HTTPS logo URL', async () => {
    process.env.APP_URL = 'http://localhost:3000'
    process.env.DATABASE_URL = 'postgres://example:example@localhost/example'
    process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-characters'
    const { resolveGoogleWalletLogoUrl } =
      await import('./google-wallet-config')
    expect(
      resolveGoogleWalletLogoUrl(
        'http://localhost:3000',
        'https://cdn.example.com/logo.png'
      )
    ).toBe('https://cdn.example.com/logo.png')
  })

  it('rejects a localhost HTTP fallback', async () => {
    const { resolveGoogleWalletLogoUrl } =
      await import('./google-wallet-config')
    expect(() => resolveGoogleWalletLogoUrl('http://localhost:3000')).toThrow(
      'HTTPS public logo URL'
    )
  })

  it('uses the branded logo path for an HTTPS app URL', async () => {
    const { resolveGoogleWalletLogoUrl } =
      await import('./google-wallet-config')
    expect(resolveGoogleWalletLogoUrl('https://central.example')).toBe(
      'https://central.example/brand/google-logo.png'
    )
  })
})
