import { LoyaltyError } from '@/domain/loyalty/errors'
import type { NewStamp, StampRepository } from '@/domain/loyalty/repositories'
import type { DatabaseExecutor } from '@/infrastructure/db/client'
import { cards, stamps } from '@/infrastructure/db/schema'
import { and, eq } from 'drizzle-orm'

import { isUniqueViolation } from './postgres-error'

/** Persists immutable stamp-ledger entries through Drizzle. */
export class DrizzleStampRepository implements StampRepository {
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
   * Inserts one stamp ledger entry.
   *
   * @param input - Immutable ledger values.
   */
  async create(input: NewStamp): Promise<void> {
    try {
      await this.#database.insert(stamps).values(input)
    } catch (error) {
      if (isUniqueViolation(error, 'stamps_order_number_unique')) {
        throw new LoyaltyError(
          'DUPLICATE_ORDER',
          `Order ${input.orderNumber ?? ''} already has a stamp`
        )
      }
      throw error
    }
  }

  /**
   * Reports whether a customer has any previous order stamp.
   *
   * @param customerId - Customer whose ledger should be searched.
   */
  async hasOrderForCustomer(customerId: string): Promise<boolean> {
    const rows = await this.#database
      .select({ id: stamps.id })
      .from(stamps)
      .innerJoin(cards, eq(stamps.cardId, cards.id))
      .where(and(eq(cards.customerId, customerId), eq(stamps.source, 'order')))
      .limit(1)
    return rows.length > 0
  }

  /**
   * Reports whether an order number already appears in the ledger.
   *
   * @param orderNumber - Order number to search globally.
   */
  async isOrderNumberTaken(orderNumber: string): Promise<boolean> {
    const rows = await this.#database
      .select({ id: stamps.id })
      .from(stamps)
      .where(eq(stamps.orderNumber, orderNumber))
      .limit(1)
    return rows.length > 0
  }
}
