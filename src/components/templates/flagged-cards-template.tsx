import { PageHeader } from '@/components/molecules/page-header'
import { FlaggedCardList } from '@/components/organisms/flagged-card-list'
import type { FlaggedCardSummary } from '@/infrastructure/db/admin-dashboard'

type FlaggedCardsTemplateProps = {
  cards: FlaggedCardSummary[]
}

/**
 * Composes the flagged-card review page.
 *
 * @param props - Flagged cards.
 * @param props.cards - Cards requiring review.
 */
export function FlaggedCardsTemplate({
  cards,
}: FlaggedCardsTemplateProps): React.JSX.Element {
  return (
    <div className="space-y-6">
      <PageHeader
        description="Revisa tarjetas detectadas en más de un dispositivo Apple."
        title="Tarjetas flagged"
      />
      <FlaggedCardList cards={cards} />
    </div>
  )
}
