import { describe, expect, it } from 'vitest'

import {
  appleUnauthorizedResponse,
  isApplePassAuthorized,
} from './apple-web-service-auth'

describe('Apple pass web-service authorization', () => {
  it('accepts the exact ApplePass token', () => {
    expect(
      isApplePassAuthorized('ApplePass secret-token', 'secret-token')
    ).toBe(true)
  })

  it('returns a 401 response for an invalid token', () => {
    expect(isApplePassAuthorized('ApplePass wrong-token', 'secret-token')).toBe(
      false
    )
    expect(appleUnauthorizedResponse().status).toBe(401)
  })
})
