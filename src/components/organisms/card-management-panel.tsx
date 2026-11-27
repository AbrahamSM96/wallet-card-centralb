'use client'

import {
  issueReplacementCardAction,
  markCardReviewedAction,
  resyncWalletAction,
  voidCardAction,
} from '@/app/(admin)/admin/actions'
import { Alert } from '@/components/atoms/alert'
import { Input } from '@/components/atoms/input'
import { SubmitButton } from '@/components/atoms/submit-button'
import { ClaimDeliveryCard } from '@/components/organisms/claim-delivery-card'
import { useActionState } from 'react'

type CardManagementPanelProps = {
  cardId: string | null
  customerId: string
  platform: 'apple' | 'google' | null
  status: 'active' | 'flagged' | 'voided' | null
}

/**
 * Reviews, voids, or replaces a customer's current card.
 *
 * @param props - Current customer and card state.
 * @param props.cardId - Current non-voided card identifier.
 * @param props.customerId - Customer identifier.
 * @param props.platform - Claimed wallet platform.
 * @param props.status - Current card status.
 */
export function CardManagementPanel({
  cardId,
  customerId,
  platform,
  status,
}: CardManagementPanelProps): React.JSX.Element {
  const [reviewState, reviewAction] = useActionState(markCardReviewedAction, {})
  const [voidState, voidAction] = useActionState(voidCardAction, {})
  const [issueState, issueAction] = useActionState(
    issueReplacementCardAction,
    {}
  )
  const [resyncState, resyncAction] = useActionState(resyncWalletAction, {})

  return (
    <section className="space-y-4 rounded-[24px] border border-cacao/20 bg-white p-5">
      <div>
        <h2 className="font-semibold">Administrar tarjeta</h2>
        <p className="mt-1 text-sm text-cacao">
          Revisa alertas, anula una tarjeta o emite una reposición.
        </p>
      </div>
      {cardId ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          {status === 'flagged' ? (
            <form action={reviewAction} className="space-y-2">
              <Input name="cardId" type="hidden" value={cardId} />
              <Input name="customerId" type="hidden" value={customerId} />
              <SubmitButton pendingLabel="Revisando…">
                Marcar como revisada
              </SubmitButton>
              {reviewState.error ? (
                <Alert tone="error">{reviewState.error}</Alert>
              ) : null}
              {reviewState.success ? (
                <Alert tone="success">{reviewState.success}</Alert>
              ) : null}
            </form>
          ) : null}
          <form action={voidAction} className="space-y-2">
            <Input name="cardId" type="hidden" value={cardId} />
            <Input name="customerId" type="hidden" value={customerId} />
            <SubmitButton pendingLabel="Anulando…" variant="outline">
              Anular tarjeta
            </SubmitButton>
            {voidState.error ? (
              <Alert tone="error">{voidState.error}</Alert>
            ) : null}
            {voidState.success ? (
              <Alert tone="success">{voidState.success}</Alert>
            ) : null}
          </form>
          {platform === 'google' ? (
            <form action={resyncAction} className="space-y-2">
              <Input name="cardId" type="hidden" value={cardId} />
              <Input name="customerId" type="hidden" value={customerId} />
              <SubmitButton pendingLabel="Sincronizando…" variant="outline">
                Resincronizar wallet
              </SubmitButton>
              {resyncState.error ? (
                <Alert tone="error">{resyncState.error}</Alert>
              ) : null}
              {resyncState.success ? (
                <Alert tone="success">{resyncState.success}</Alert>
              ) : null}
            </form>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <form action={issueAction} className="space-y-3">
            <Input name="customerId" type="hidden" value={customerId} />
            {issueState.error ? (
              <Alert tone="error">{issueState.error}</Alert>
            ) : null}
            {issueState.success ? (
              <Alert tone="success">{issueState.success}</Alert>
            ) : null}
            <SubmitButton pendingLabel="Emitiendo…">
              Emitir tarjeta nueva
            </SubmitButton>
          </form>
          {issueState.claimDelivery ? (
            <ClaimDeliveryCard delivery={issueState.claimDelivery} />
          ) : null}
        </div>
      )}
    </section>
  )
}
