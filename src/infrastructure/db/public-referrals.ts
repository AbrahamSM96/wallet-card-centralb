import { db } from '@/infrastructure/db/client'
import { cards } from '@/infrastructure/db/schema'
import { and, eq, ne } from 'drizzle-orm'

/**
 * Reports whether a public referral code belongs to a current card.
 *
 * @param publicCode - Human-readable referral card code.
 */
export async function hasActiveReferralCard(
  publicCode: string
): Promise<boolean> {
  const rows = await db
    .select({ id: cards.id })
    .from(cards)
    .where(
      and(
        eq(cards.publicCode, publicCode.toUpperCase()),
        ne(cards.status, 'voided')
      )
    )
    .limit(1)
  return rows.length > 0
}
