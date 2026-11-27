'use server'

import { LoyaltyError } from '@/domain/loyalty/errors'
import { referralRegistrationSchema } from '@/domain/referrals/referral-registration'
import { publicFormRateLimiter } from '@/infrastructure/auth/login-rate-limiter'
import { loyaltyService } from '@/infrastructure/loyalty-service'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

const CLAIM_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export type ReferralActionState = {
  error?: string
}

/**
 * Registers a referred customer and redirects to the one-time claim.
 *
 * @param _previousState - Previous React action state.
 * @param formData - Untrusted public referral form.
 */
export async function registerReferralAction(
  _previousState: ReferralActionState,
  formData: FormData
): Promise<ReferralActionState> {
  const parsed = referralRegistrationSchema.safeParse({
    birthday: formData.get('birthday'),
    email: formData.get('email'),
    honeypot: formData.get('website'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    privacyAccepted: formData.get('privacyAccepted'),
    referrerPublicCode: formData.get('referrerPublicCode'),
  })
  if (!parsed.success) {
    return { error: 'Revisa los datos y acepta el aviso de privacidad.' }
  }

  const requestHeaders = await headers()
  const address = requestHeaders.get('x-forwarded-for') ?? 'unknown'
  const rateLimitKey = `${address}:${parsed.data.referrerPublicCode}`
  if (!publicFormRateLimiter.consume(rateLimitKey)) {
    return { error: 'Demasiados intentos. Intenta más tarde.' }
  }

  let claimToken: string
  try {
    const result = await loyaltyService.registerReferral({
      birthday: parsed.data.birthday,
      claimExpiresAt: new Date(Date.now() + CLAIM_DURATION_MS),
      email: parsed.data.email,
      name: parsed.data.name,
      phone: parsed.data.phone,
      privacyAcceptedAt: new Date(),
      referrerPublicCode: parsed.data.referrerPublicCode,
    })
    claimToken = result.claimToken
  } catch (error) {
    return { error: referralErrorMessage(error) }
  }

  redirect(`/c/${claimToken}`)
}

/**
 * Converts expected referral failures into safe public messages.
 *
 * @param error - Unknown registration failure.
 */
function referralErrorMessage(error: unknown): string {
  if (error instanceof LoyaltyError) {
    if (error.code === 'CUSTOMER_ALREADY_EXISTS') {
      return 'El teléfono o correo ya está registrado.'
    }
    if (error.code === 'REFERRER_CARD_NOT_FOUND') {
      return 'Esta invitación ya no está disponible.'
    }
  }
  return 'No pudimos crear tu tarjeta. Intenta de nuevo.'
}
