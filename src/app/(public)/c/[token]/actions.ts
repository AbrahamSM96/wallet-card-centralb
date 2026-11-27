'use server'

import { LoyaltyError } from '@/domain/loyalty/errors'
import { loyaltyService } from '@/infrastructure/loyalty-service'
import { ServerLogger } from '@/infrastructure/server-logger'
import { GoogleWalletConfigurationError } from '@/infrastructure/wallet/google/google-wallet-config'
import { WalletSyncService } from '@/infrastructure/wallet/wallet-sync-service'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const claimSchema = z.object({
  privacyAccepted: z.enum(['on']).optional(),
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
})

export type ClaimActionState = {
  error?: string
}

/**
 * Issues Google Wallet resources, consumes the token, then redirects to save.
 *
 * @param _previousState - Previous React action state.
 * @param formData - Untrusted public claim input.
 */
export async function claimGoogleAction(
  _previousState: ClaimActionState,
  formData: FormData
): Promise<ClaimActionState> {
  const parsed = claimSchema.safeParse({
    privacyAccepted: formData.get('privacyAccepted') ?? undefined,
    token: formData.get('token'),
  })
  if (!parsed.success) return { error: 'El link de reclamo no es válido.' }

  let saveUrl: string
  try {
    const claimContext = await loyaltyService.getClaimContext(parsed.data.token)
    if (claimContext.privacyRequired && parsed.data.privacyAccepted !== 'on') {
      return { error: 'Debes aceptar el aviso de privacidad.' }
    }
    const walletSync = new WalletSyncService()
    const issueResult = await walletSync.issue(claimContext.cardId, 'google')
    if (!issueResult.saveUrl) {
      throw new Error('Google Wallet save URL is missing')
    }
    await loyaltyService.claimCard({
      platform: 'google',
      privacyAccepted: parsed.data.privacyAccepted === 'on',
      token: parsed.data.token,
    })
    saveUrl = issueResult.saveUrl
  } catch (error) {
    new ServerLogger().error('Google Wallet claim failed', error)
    return { error: claimErrorMessage(error) }
  }

  redirect(saveUrl)
}

/**
 * Maps public claim failures without exposing infrastructure details.
 *
 * @param error - Unknown claim failure.
 */
function claimErrorMessage(error: unknown): string {
  if (error instanceof GoogleWalletConfigurationError) {
    return 'Google Wallet todavía no está configurado.'
  }
  if (error instanceof LoyaltyError) {
    if (error.code === 'CLAIM_TOKEN_USED') {
      return 'Esta tarjeta ya fue reclamada.'
    }
    if (error.code === 'CLAIM_TOKEN_EXPIRED') {
      return 'El link de reclamo expiró.'
    }
    return 'El link de reclamo no es válido.'
  }
  return 'No pudimos preparar Google Wallet. Intenta de nuevo.'
}
