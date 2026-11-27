import { describe, expect, it } from 'vitest'

import {
  getMexicoCityDate,
  hasBirthdayPromotionExpired,
  isBirthdayOnDate,
  isBirthdayPromotionActive,
} from './birthday-date'

describe('birthday dates', () => {
  it('uses the America/Mexico_City calendar boundary', () => {
    expect(getMexicoCityDate(new Date('2026-03-01T05:59:59Z'))).toEqual({
      day: 28,
      month: 2,
      year: 2026,
    })
    expect(getMexicoCityDate(new Date('2026-03-01T06:00:00Z'))).toEqual({
      day: 1,
      month: 3,
      year: 2026,
    })
  })

  it('observes February 29 on February 28 outside leap years', () => {
    expect(
      isBirthdayOnDate('1992-02-29', { day: 28, month: 2, year: 2026 })
    ).toBe(true)
    expect(
      isBirthdayOnDate('1992-02-29', { day: 28, month: 2, year: 2028 })
    ).toBe(false)
    expect(
      isBirthdayOnDate('1992-02-29', { day: 29, month: 2, year: 2028 })
    ).toBe(true)
  })

  it('keeps the promotion visible for seven calendar days', () => {
    expect(
      isBirthdayPromotionActive('1990-05-10', 2026, {
        day: 16,
        month: 5,
        year: 2026,
      })
    ).toBe(true)
    expect(
      hasBirthdayPromotionExpired('1990-05-10', 2026, {
        day: 17,
        month: 5,
        year: 2026,
      })
    ).toBe(true)
  })
})
