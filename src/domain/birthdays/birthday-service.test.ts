import { describe, expect, it, vi } from 'vitest'

import { type BirthdayRepository, BirthdayService } from './birthday-service'

describe('BirthdayService', () => {
  it('reserves before notifying and remains idempotent in the same year', async () => {
    const reservations = new Set<string>()
    const repository: BirthdayRepository = {
      getBirthdayPromoText: () => Promise.resolve('Promo de cumpleaños'),
      listClaimedCards: () =>
        Promise.resolve([
          {
            birthday: '1990-05-10',
            cardId: 'card',
            customerId: 'customer',
          },
        ]),
      listPendingCleanup: () => Promise.resolve([]),
      listPendingNotifications: () => Promise.resolve([]),
      markCleared: () => Promise.resolve(),
      markNotified: () => Promise.resolve(),
      reserve: (customerId, year, _attemptedAt) => {
        const key = `${customerId}-${year}`
        if (reservations.has(key)) return Promise.resolve(false)
        reservations.add(key)
        return Promise.resolve(true)
      },
    }
    const notify = vi.fn().mockResolvedValue(undefined)
    const service = new BirthdayService({
      notifier: { clear: vi.fn(), notify },
      repository,
    })
    const now = new Date('2026-05-10T15:00:00Z')

    await service.run(now)
    await service.run(now)

    expect(notify).toHaveBeenCalledOnce()
    expect(notify).toHaveBeenCalledWith('card', 'Promo de cumpleaños', 2026)
    expect(reservations.size).toBe(1)
  })

  it('retries an unnotified reservation inside the seven-day window', async () => {
    let lastAttemptAt: Date | null = null
    let notifiedAt: Date | null = null
    const card = {
      birthday: '1990-05-10',
      cardId: 'card',
      customerId: 'customer',
    }
    const repository: BirthdayRepository = {
      getBirthdayPromoText: () => Promise.resolve('Promo de cumpleaños'),
      listClaimedCards: () => Promise.resolve([card]),
      listPendingCleanup: () => Promise.resolve([]),
      listPendingNotifications: () =>
        Promise.resolve(
          lastAttemptAt && !notifiedAt
            ? [{ ...card, notificationYear: 2026 }]
            : []
        ),
      markCleared: () => Promise.resolve(),
      markNotified: (_customerId, _year, value) => {
        notifiedAt = value
        return Promise.resolve()
      },
      reserve: (_customerId, _year, attemptedAt) => {
        if (notifiedAt) return Promise.resolve(false)
        if (
          lastAttemptAt &&
          attemptedAt.getTime() - lastAttemptAt.getTime() < 60 * 60 * 1000
        ) {
          return Promise.resolve(false)
        }
        lastAttemptAt = attemptedAt
        return Promise.resolve(true)
      },
    }
    const notify = vi
      .fn()
      .mockRejectedValueOnce(new Error('Wallet unavailable'))
      .mockResolvedValueOnce(undefined)
    const service = new BirthdayService({
      notifier: { clear: vi.fn(), notify },
      repository,
    })

    const first = await service.run(new Date('2026-05-10T15:00:00Z'))
    const retry = await service.run(new Date('2026-05-11T15:00:00Z'))

    expect(first.failed).toBe(1)
    expect(retry.notified).toBe(1)
    expect(notify).toHaveBeenCalledTimes(2)
    expect(notifiedAt).toBeInstanceOf(Date)
  })
})
