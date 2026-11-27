'use client'

import { createCustomerAction } from '@/app/(admin)/admin/actions'
import { Alert } from '@/components/atoms/alert'
import { SubmitButton } from '@/components/atoms/submit-button'
import { FormField } from '@/components/molecules/form-field'
import { ClaimDeliveryCard } from '@/components/organisms/claim-delivery-card'
import { useActionState } from 'react'

/** Renders customer registration and its one-time claim result. */
export function CustomerRegistrationForm(): React.JSX.Element {
  const [state, formAction] = useActionState(createCustomerAction, {})

  return (
    <div className="space-y-6">
      <form
        action={formAction}
        className="grid gap-5 rounded-2xl border border-stone-200 bg-white p-5 sm:grid-cols-2 sm:p-7"
      >
        <FormField id="name" label="Nombre" name="name" required />
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
          autoComplete="email"
          id="email"
          label="Correo (opcional)"
          name="email"
          type="email"
        />
        <FormField
          id="birthday"
          label="Cumpleaños"
          name="birthday"
          required
          type="date"
        />
        <div className="sm:col-span-2">
          {state.error ? <Alert tone="error">{state.error}</Alert> : null}
          {state.success ? <Alert tone="success">{state.success}</Alert> : null}
        </div>
        <div className="sm:col-span-2">
          <SubmitButton pendingLabel="Creando cliente…">
            Crear cliente y tarjeta
          </SubmitButton>
        </div>
      </form>
      {state.claimDelivery ? (
        <ClaimDeliveryCard delivery={state.claimDelivery} />
      ) : null}
    </div>
  )
}
