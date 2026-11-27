'use client'

import { reissueClaimTokenAction } from '@/app/(admin)/admin/actions'
import { Alert } from '@/components/atoms/alert'
import { Input } from '@/components/atoms/input'
import { SubmitButton } from '@/components/atoms/submit-button'
import { CheckboxField } from '@/components/molecules/checkbox-field'
import { ClaimDeliveryCard } from '@/components/organisms/claim-delivery-card'
import { useActionState } from 'react'

type ReissueClaimFormProps = {
  cardId: string
  customerId: string
}

/**
 * Rotates a one-time claim link and optionally clears prior claim state.
 *
 * @param props - Card to receive a replacement token.
 * @param props.cardId - Card identifier.
 * @param props.customerId - Customer identifier used for targeted refresh.
 */
export function ReissueClaimForm({
  cardId,
  customerId,
}: ReissueClaimFormProps): React.JSX.Element {
  const [state, formAction] = useActionState(reissueClaimTokenAction, {})

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <Input name="cardId" type="hidden" value={cardId} />
        <Input name="customerId" type="hidden" value={customerId} />
        <CheckboxField
          description="Úsalo si la descarga anterior falló después de marcar la tarjeta como reclamada."
          id="resetClaim"
          label="Reiniciar estado de reclamo"
          name="resetClaim"
        />
        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.success ? <Alert tone="success">{state.success}</Alert> : null}
        <SubmitButton pendingLabel="Generando…" variant="outline">
          Generar nuevo link
        </SubmitButton>
      </form>
      {state.claimDelivery ? (
        <ClaimDeliveryCard delivery={state.claimDelivery} />
      ) : null}
    </div>
  )
}
