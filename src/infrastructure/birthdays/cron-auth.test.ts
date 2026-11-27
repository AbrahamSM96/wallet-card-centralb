import { describe, expect, it } from 'vitest'

import { authorizeCronRequest } from './cron-auth'

describe('authorizeCronRequest', () => {
  it('returns 401 when the secret or header is missing', () => {
    expect(authorizeCronRequest(null, 'a'.repeat(32))?.status).toBe(401)
    expect(authorizeCronRequest('Bearer value', undefined)?.status).toBe(401)
  })

  it('accepts the exact Bearer secret', () => {
    const secret = 'a'.repeat(32)
    expect(authorizeCronRequest(`Bearer ${secret}`, secret)).toBeNull()
  })
})
