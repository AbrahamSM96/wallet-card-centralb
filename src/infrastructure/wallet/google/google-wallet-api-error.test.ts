import { describe, expect, it } from 'vitest'

import { createGoogleWalletApiError } from './google-wallet-api-error'

describe('createGoogleWalletApiError', () => {
  it('includes Google status and nested message', () => {
    const error = createGoogleWalletApiError(
      400,
      JSON.stringify({
        error: {
          message:
            'Image cannot be loaded. Invalid image URL: http://localhost/logo.png',
        },
      })
    )
    expect(error.message).toContain('Google Wallet API 400')
    expect(error.message).toContain('Image cannot be loaded')
  })

  it('truncates unusually long response bodies', () => {
    const error = createGoogleWalletApiError(500, 'x'.repeat(1_000))
    expect(error.message.length).toBeLessThan(350)
  })
})
