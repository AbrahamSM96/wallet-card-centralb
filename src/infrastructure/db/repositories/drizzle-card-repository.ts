import { LoyaltyError } from '@/domain/loyalty/errors'
import type { CardRepository, NewCard } from '@/domain/loyalty/repositories'
import type { Card, CardPlatform } from '@/domain/loyalty/types'
import type { DatabaseExecutor } from '@/infrastructure/db/client'
import { cards } from '@/infrastructure/db/schema'
import { and, eq, ne } from 'drizzle-orm'

import { isUniqueViolation } from './postgres-error'

/** Persists loyalty cards through a transaction-scoped Drizzle executor. */
export class DrizzleCardRepository implements CardRepository {
  readonly #database: DatabaseExecutor

  /**
   * Creates the repository for one database or transaction executor.
   *
   * @param database - Drizzle executor used by every operation.
   */
  constructor(database: DatabaseExecutor) {
    this.#database = database
  }

  /**
   * Creates an active loyalty card.
   *
   * @param input - New card values.
   */
  async create(input: NewCard): Promise<Card> {
    try {
      const rows = await this.#database.insert(cards).values(input).returning()
      return mapCard(rows[0])
    } catch (error) {
      if (isUniqueViolation(error, 'cards_public_code_unique')) {
        throw new LoyaltyError(
          'PUBLIC_CODE_CONFLICT',
          `Public code ${input.publicCode} already exists`
        )
      }
      if (isUniqueViolation(error, 'cards_customer_active_unique')) {
        throw new LoyaltyError(
          'CUSTOMER_HAS_ACTIVE_CARD',
          `Customer ${input.customerId} already has an active card`
        )
      }
      throw error
    }
  }

  /**
   * Locks and returns the current non-voided card for a customer.
   *
   * @param customerId - Customer identifier.
   */
  async findActiveByCustomerForUpdate(
    customerId: string
  ): Promise<Card | null> {
    const rows = await this.#database
      .select()
      .from(cards)
      .where(and(eq(cards.customerId, customerId), ne(cards.status, 'voided')))
      .limit(1)
      .for('update')
    const card = rows[0]
    return card ? mapCard(card) : null
  }

  /**
   * Locks and returns a current card by its public code.
   *
   * @param publicCode - Human-readable card code.
   */
  async findActiveByPublicCodeForUpdate(
    publicCode: string
  ): Promise<Card | null> {
    const rows = await this.#database
      .select()
      .from(cards)
      .where(and(eq(cards.publicCode, publicCode), ne(cards.status, 'voided')))
      .limit(1)
      .for('update')
    const card = rows[0]
    return card ? mapCard(card) : null
  }

  /**
   * Locks and returns a card by identifier.
   *
   * @param cardId - Card identifier.
   */
  async findByIdForUpdate(cardId: string): Promise<Card | null> {
    const rows = await this.#database
      .select()
      .from(cards)
      .where(eq(cards.id, cardId))
      .limit(1)
      .for('update')
    const card = rows[0]
    return card ? mapCard(card) : null
  }

  /**
   * Reports whether a public code is already allocated.
   *
   * @param publicCode - Human-readable card code.
   */
  async isPublicCodeTaken(publicCode: string): Promise<boolean> {
    const rows = await this.#database
      .select({ id: cards.id })
      .from(cards)
      .where(eq(cards.publicCode, publicCode))
      .limit(1)
    return rows.length > 0
  }

  /**
   * Marks a card as claimed on a wallet platform.
   *
   * @param cardId - Card identifier.
   * @param claimedAt - Claim time.
   * @param platform - Selected wallet platform.
   */
  async markClaimed(
    cardId: string,
    claimedAt: Date,
    platform: CardPlatform
  ): Promise<void> {
    await this.#database
      .update(cards)
      .set({ claimedAt, platform })
      .where(eq(cards.id, cardId))
  }

  /**
   * Clears wallet claim state before an administrator-authorized retry.
   *
   * @param cardId - Card identifier.
   */
  async resetClaim(cardId: string): Promise<void> {
    await this.#database
      .update(cards)
      .set({ claimedAt: null, platform: null })
      .where(eq(cards.id, cardId))
  }

  /**
   * Changes the administrative status of a card.
   *
   * @param cardId - Card identifier.
   * @param status - New card status.
   */
  async updateStatus(cardId: string, status: Card['status']): Promise<void> {
    await this.#database
      .update(cards)
      .set({ status })
      .where(eq(cards.id, cardId))
  }

  /**
   * Replaces the cached stamp count after a ledger mutation.
   *
   * @param cardId - Card identifier.
   * @param stampCount - New cached ledger total.
   */
  async updateStampCount(cardId: string, stampCount: number): Promise<void> {
    await this.#database
      .update(cards)
      .set({ stampCount })
      .where(eq(cards.id, cardId))
  }
}

/**
 * Maps a Drizzle card row to the persistence-independent domain shape.
 *
 * @param row - Card row returned by Drizzle.
 */
function mapCard(row: typeof cards.$inferSelect): Card {
  return {
    claimedAt: row.claimedAt,
    customerId: row.customerId,
    id: row.id,
    platform: row.platform,
    publicCode: row.publicCode,
    stampCount: row.stampCount,
    status: row.status,
  }
}
