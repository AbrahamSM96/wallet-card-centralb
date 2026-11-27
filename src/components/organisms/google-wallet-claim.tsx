'use client'

import { claimGoogleAction } from '@/app/(public)/c/[token]/actions'
import { Alert } from '@/components/atoms/alert'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { SubmitButton } from '@/components/atoms/submit-button'
import { PrivacyConsentField } from '@/components/molecules/privacy-consent-field'
import { useActionState } from 'react'

type GoogleWalletClaimProps = {
  isAndroid: boolean
  isIOS: boolean
  privacyRequired: boolean
  token: string
}

/**
 * Offers Google Wallet and displays safe claim failures.
 *
 * @param props - Device hint and raw URL token.
 * @param props.isAndroid - Whether the user agent reports Android.
 * @param props.isIOS - Whether the user agent reports iOS.
 * @param props.privacyRequired - Whether claim needs privacy acceptance.
 * @param props.token - One-time claim token from the route.
 */
export function GoogleWalletClaim({
  isAndroid,
  isIOS,
  privacyRequired,
  token,
}: GoogleWalletClaimProps): React.JSX.Element {
  const [state, formAction] = useActionState(claimGoogleAction, {})
  return (
    <div className="mt-6 space-y-4">
      {isIOS ? (
        <form action={`/c/${token}/apple`} method="post">
          <p className="mb-3 text-sm text-cacao">
            Detectamos iPhone o iPad. Apple Wallet es la opción recomendada.
          </p>
          {privacyRequired ? (
            <PrivacyConsentField id="privacyAcceptedApple" />
          ) : null}
          <Button type="submit">Agregar a Apple Wallet</Button>
        </form>
      ) : null}
      <form action={formAction} className="space-y-4">
        <Input name="token" type="hidden" value={token} />
        <p className="text-sm text-cacao">
          {isAndroid
            ? 'Detectamos Android. Google Wallet es la opción recomendada.'
            : 'También puedes guardar la tarjeta en tu cuenta de Google Wallet.'}
        </p>
        {privacyRequired ? (
          <PrivacyConsentField id="privacyAcceptedGoogle" />
        ) : null}
        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        <SubmitButton pendingLabel="Preparando Google Wallet…">
          Agregar a Google Wallet
        </SubmitButton>
      </form>
    </div>
  )
}
