import { ActionLink } from '@/components/atoms/action-link'
import { Badge } from '@/components/atoms/badge'
import type { FlaggedCardSummary } from '@/infrastructure/db/admin-dashboard'
import { formatMexicanPhone } from '@/lib/claim-delivery'

type FlaggedCardListProps = {
  cards: FlaggedCardSummary[]
}

/**
 * Lists cards flagged for administrator review.
 *
 * @param props - Flagged card records.
 * @param props.cards - Cards requiring review.
 */
export function FlaggedCardList({
  cards,
}: FlaggedCardListProps): React.JSX.Element {
  if (cards.length === 0) {
    return <p className="text-stone-600">No hay tarjetas flagged.</p>
  }

  return (
    <div className="grid gap-3">
      {cards.map((card) => (
        <article
          className="rounded-xl border border-red-200 bg-white p-4"
          key={card.publicCode}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-semibold">{card.customerName}</h2>
              <p className="text-sm text-stone-600">
                {formatMexicanPhone(card.phone)}
              </p>
            </div>
            <Badge tone="red">{card.publicCode}</Badge>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm">{card.stampCount} sellos</span>
            <ActionLink href={`/admin/clientes/${card.customerId}`}>
              Revisar
            </ActionLink>
          </div>
        </article>
      ))}
    </div>
  )
}
