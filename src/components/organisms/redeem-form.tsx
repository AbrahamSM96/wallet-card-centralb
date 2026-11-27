'use client'

import { redeemRewardAction } from '@/app/(admin)/admin/actions'
import { Alert } from '@/components/atoms/alert'
import { Input } from '@/components/atoms/input'
import { SubmitButton } from '@/components/atoms/submit-button'
import { useActionState } from 'react'

type RedeemFormProps = {
  cardId: string
  customerId: string
  enabled: boolean
  goal: number
  remainder: number
}

/**
 * Redeems one configured goal and explains the retained remainder.
 *
 * @param props - Current redemption state.
 * @param props.cardId - Card identifier.
 * @param props.customerId - Customer identifier used for targeted refresh.
 * @param props.enabled - Whether the goal is currently met.
 * @param props.goal - Stamps consumed by one redemption.
 * @param props.remainder - Stamps remaining after redemption.
 */
export function RedeemForm({
  cardId,
  customerId,
  enabled,
  goal,
  remainder,
}: RedeemFormProps): React.JSX.Element {
  const [state, formAction] = useActionState(redeemRewardAction, {})

  return (
    <form action={formAction} className="space-y-3">
      <Input name="cardId" type="hidden" value={cardId} />
      <Input name="customerId" type="hidden" value={customerId} />
      <p className="text-sm text-cacao">
        Consume {goal} sellos y conserva {remainder} de remanente.
      </p>
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}
      <SubmitButton
        disabled={!enabled}
        pendingLabel="Canjeando…"
        variant="outline"
      >
        {enabled ? 'Canjear premio' : 'Meta todavía no alcanzada'}
      </SubmitButton>
    </form>
  )
}
