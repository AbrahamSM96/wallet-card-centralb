import { describe, expect, it } from 'vitest'

import { formatMexicanPhone, normalizeMexicanPhone } from './claim-delivery'

describe('normalizeMexicanPhone', () => {
  it('adds the Mexico country code to a national number', () => {
    expect(normalizeMexicanPhone('771 123 4567')).toBe('+527711234567')
  })

  it('preserves a Mexican number that already includes country code', () => {
    expect(normalizeMexicanPhone('+52 771 123 4567')).toBe('+527711234567')
  })

  it('rejects numbers with an invalid length', () => {
    expect(normalizeMexicanPhone('123')).toBe('')
  })

  it('formats canonical phones for display', () => {
    expect(formatMexicanPhone('+527715550199')).toBe('771 555 0199')
  })
})
