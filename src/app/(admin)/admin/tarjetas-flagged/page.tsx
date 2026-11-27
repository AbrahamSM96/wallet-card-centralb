import { FlaggedCardsTemplate } from '@/components/templates/flagged-cards-template'
import { requireAdmin } from '@/infrastructure/auth/require-admin'
import { listFlaggedCards } from '@/infrastructure/db/admin-dashboard'

/** Renders cards marked for multi-device review. */
export default async function FlaggedCardsPage(): Promise<React.JSX.Element> {
  await requireAdmin()
  const cards = await listFlaggedCards()
  return <FlaggedCardsTemplate cards={cards} />
}
