'use client'

import { registerReferralAction } from '@/app/(public)/r/[code]/actions'
import { Alert } from '@/components/atoms/alert'
import { Input } from '@/components/atoms/input'
import { SubmitButton } from '@/components/atoms/submit-button'
import { FormField } from '@/components/molecules/form-field'
import { PrivacyConsentField } from '@/components/molecules/privacy-consent-field'
import { useActionState } from 'react'

type ReferralRegistrationFormProps = {
  referrerPublicCode: string
}

/**
 * Registers a referred customer with privacy and anti-spam controls.
 *
 * @param props - Referral code from the validated route.
 * @param props.referrerPublicCode - Active referrer card code.
 */
export function ReferralRegistrationForm({
  referrerPublicCode,
}: ReferralRegistrationFormProps): React.JSX.Element {
  const [state, formAction] = useActionState(registerReferralAction, {})
  return (
    <form action={formAction} className="space-y-5">
      <Input
        aria-hidden="true"
        autoComplete="off"
        className="hidden"
        name="website"
        tabIndex={-1}
      />
      <Input
        name="referrerPublicCode"
        type="hidden"
        value={referrerPublicCode}
      />
      <FormField id="name" label="Nombre" name="name" required />
      <FormField
        autoComplete="email"
        id="email"
        label="Correo"
        name="email"
        required
        type="email"
      />
      <FormField
        autoComplete="tel"
        id="phone"
        inputMode="tel"
        label="Celular"
        name="phone"
        placeholder="771 123 4567"
        required
      />
      <FormField
        id="birthday"
        label="Cumpleaños"
        name="birthday"
        required
        type="date"
      />
      <PrivacyConsentField />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      <SubmitButton pendingLabel="Creando tu tarjeta…">
        Obtener mi tarjeta
      </SubmitButton>
    </form>
  )
}
