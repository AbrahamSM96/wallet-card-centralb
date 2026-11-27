const ATTEMPT_WINDOW_MS = 15 * 60 * 1000
const MAX_ATTEMPTS = 5

type Attempt = {
  count: number
  resetAt: number
}

/** Limits repeated login attempts in one warm application instance. */
export class LoginRateLimiter {
  readonly #attempts = new Map<string, Attempt>()

  /**
   * Records an attempt and reports whether it may proceed.
   *
   * @param key - Stable identifier made from the client and account.
   * @param now - Current Unix time in milliseconds.
   */
  consume(key: string, now = Date.now()): boolean {
    const current = this.#attempts.get(key)

    if (!current || current.resetAt <= now) {
      this.#attempts.set(key, {
        count: 1,
        resetAt: now + ATTEMPT_WINDOW_MS,
      })
      return true
    }

    if (current.count >= MAX_ATTEMPTS) return false

    this.#attempts.set(key, { ...current, count: current.count + 1 })
    return true
  }

  /**
   * Clears attempts after successful authentication.
   *
   * @param key - Stable identifier that should be cleared.
   */
  reset(key: string): void {
    this.#attempts.delete(key)
  }
}

const globalRateLimiter = globalThis as unknown as {
  loginRateLimiter?: LoginRateLimiter
  publicFormRateLimiter?: LoginRateLimiter
}

export const loginRateLimiter =
  globalRateLimiter.loginRateLimiter ?? new LoginRateLimiter()
export const publicFormRateLimiter =
  globalRateLimiter.publicFormRateLimiter ?? new LoginRateLimiter()

if (process.env.NODE_ENV !== 'production') {
  globalRateLimiter.loginRateLimiter = loginRateLimiter
  globalRateLimiter.publicFormRateLimiter = publicFormRateLimiter
}
