'use client'

import { addStampAction } from '@/app/(admin)/admin/actions'
import { Alert } from '@/components/atoms/alert'
import { Input } from '@/components/atoms/input'
import { SubmitButton } from '@/components/atoms/submit-button'
import { FormField } from '@/components/molecules/form-field'
import { useActionState } from 'react'

type StampFormProps = {
  cardId: string
  customerId: string
}

/**
 * Adds an order-backed stamp from a mobile-friendly form.
 *
 * @param props - Target card.
 * @param props.cardId - Card identifier.
 * @param props.customerId - Customer identifier used for targeted refresh.
 */
export function StampForm({
  cardId,
  customerId,
}: StampFormProps): React.JSX.Element {
  const [state, formAction] = useActionState(addStampAction, {})

  return (
    <form action={formAction} className="space-y-4">
      <Input name="cardId" type="hidden" value={cardId} />
      <Input name="customerId" type="hidden" value={customerId} />
      <FormField
        autoCapitalize="characters"
        id="orderNumber"
        label="Número de pedido"
        name="orderNumber"
        placeholder="#1234"
        required
      />
      <FormField
        id="note"
        label="Nota (opcional)"
        name="note"
        placeholder="Entrega a domicilio"
      />
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <SubmitButton pendingLabel="Agregando sello…">+1 sello</SubmitButton>
    </form>
  )
}
