import { describe, expect, it } from 'vitest'

describe('GET /api/cron/birthdays', () => {
  it('returns 401 when CRON_SECRET is not configured', async () => {
    process.env.APP_URL = 'https://example.com'
    process.env.DATABASE_URL = 'postgres://example:example@localhost/example'
    process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-characters'
    delete process.env.CRON_SECRET
    const { GET } = await import('./route')

    const response = await GET(
      new Request('https://example.com/api/cron/birthdays')
    )
    expect(response.status).toBe(401)
  })
})
