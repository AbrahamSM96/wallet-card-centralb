import { describe, expect, it } from 'vitest'

import { GET } from './route'

describe('GET /api/wallet/strip', () => {
  it('returns 400 for invalid parameters', () => {
    const response = GET(
      new Request('https://example.com/api/wallet/strip?stamps=-1&goal=10')
    )
    expect(response.status).toBe(400)
  })

  it('returns an immutable versioned image response', () => {
    const response = GET(
      new Request('https://example.com/api/wallet/strip?stamps=7&goal=10')
    )
    expect(response.headers.get('cache-control')).toBe(
      'public, max-age=31536000, immutable'
    )
    expect(response.headers.get('content-type')).toContain('image/png')
  })
})
