import { describe, expect, it, vi } from 'vitest'

describe('scheduleSettingsWalletSync', () => {
  it('updates every claimed card and the Google class once', async () => {
    process.env.APP_URL = 'https://example.com'
    process.env.DATABASE_URL = 'postgres://example:example@localhost/example'
    process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-characters'
    const { scheduleSettingsWalletSync } =
      await import('./settings-wallet-sync')
    const update = vi.fn().mockResolvedValue(undefined)
    const updateClass = vi.fn().mockResolvedValue(undefined)
    const walletSync = {
      issue: vi.fn(),
      notify: vi.fn(),
      update,
      updateClass,
    }

    await scheduleSettingsWalletSync(
      [
        { id: 'apple-card', platform: 'apple' },
        { id: 'google-card-1', platform: 'google' },
        { id: 'google-card-2', platform: 'google' },
      ],
      {
        logger: { error: vi.fn() },
        scheduler: (task) => task(),
        walletSync,
      }
    )

    expect(update).toHaveBeenCalledTimes(3)
    expect(updateClass).toHaveBeenCalledOnce()
    expect(updateClass).toHaveBeenCalledWith('google-card-1')
  })
})
