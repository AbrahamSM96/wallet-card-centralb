import { describe, expect, it } from 'vitest'

import { stampStripSearchParamsSchema } from './stamp-strip-params'

describe('stamp strip parameters', () => {
  it('accepts integer stamp and goal values', () => {
    expect(
      stampStripSearchParamsSchema.parse({ goal: '10', stamps: '7' })
    ).toEqual({ goal: 10, stamps: 7 })
  })

  it('rejects missing, negative, fractional, and excessive values', () => {
    expect(stampStripSearchParamsSchema.safeParse({}).success).toBe(false)
    expect(
      stampStripSearchParamsSchema.safeParse({ goal: 10, stamps: -1 }).success
    ).toBe(false)
    expect(
      stampStripSearchParamsSchema.safeParse({ goal: 2.5, stamps: 1 }).success
    ).toBe(false)
    expect(
      stampStripSearchParamsSchema.safeParse({ goal: 31, stamps: 1 }).success
    ).toBe(false)
  })
})
