import { describe, expect, it } from 'vitest'

import { LoginRateLimiter } from './login-rate-limiter'

describe('LoginRateLimiter', () => {
  it('blocks the sixth attempt inside the window', () => {
    const limiter = new LoginRateLimiter()

    expect(limiter.consume('client', 1)).toBe(true)
    expect(limiter.consume('client', 2)).toBe(true)
    expect(limiter.consume('client', 3)).toBe(true)
    expect(limiter.consume('client', 4)).toBe(true)
    expect(limiter.consume('client', 5)).toBe(true)
    expect(limiter.consume('client', 6)).toBe(false)
  })

  it('allows attempts after the window resets', () => {
    const limiter = new LoginRateLimiter()

    expect(limiter.consume('client', 1)).toBe(true)
    expect(limiter.consume('client', 15 * 60 * 1000 + 1)).toBe(true)
  })

  it('allows attempts after an explicit reset', () => {
    const limiter = new LoginRateLimiter()

    expect(limiter.consume('client', 1)).toBe(true)
    limiter.reset('client')
    expect(limiter.consume('client', 2)).toBe(true)
  })
})
