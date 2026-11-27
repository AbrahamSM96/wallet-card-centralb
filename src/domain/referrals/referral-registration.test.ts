import { describe, expect, it } from 'vitest'

import { referralRegistrationSchema } from './referral-registration'

const validInput = {
  birthday: '1990-05-10',
  email: 'referred@example.com',
  honeypot: '',
  name: 'Cliente Referido',
  phone: '771 123 4567',
  privacyAccepted: 'on',
  referrerPublicCode: 'CB-2345',
}

describe('referralRegistrationSchema', () => {
  it('requires privacy acceptance', () => {
    expect(
      referralRegistrationSchema.safeParse({
        ...validInput,
        privacyAccepted: undefined,
      }).success
    ).toBe(false)
  })

  it('rejects a filled anti-spam honeypot', () => {
    expect(
      referralRegistrationSchema.safeParse({
        ...validInput,
        honeypot: 'https://spam.example',
      }).success
    ).toBe(false)
  })
})
