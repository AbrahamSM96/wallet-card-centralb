import type {
  BirthdayCard,
  BirthdayCleanup,
  BirthdayPendingNotification,
  BirthdayRepository,
} from '@/domain/birthdays/birthday-service'
import { db } from '@/infrastructure/db/client'
import {
  birthdayNotifications,
  cards,
  customers,
  settings,
} from '@/infrastructure/db/schema'
import { and, eq, isNotNull, isNull, lt, ne, or } from 'drizzle-orm'

/** Persists annual birthday reservations and cleanup state through Drizzle. */
export class DrizzleBirthdayRepository implements BirthdayRepository {
  readonly #database: typeof db

  /**
   * Creates the repository around the application database.
   *
   * @param database - Drizzle database client.
   */
  constructor(database: typeof db = db) {
    this.#database = database
  }

  /** Returns the configured birthday promotion text. */
  async getBirthdayPromoText(): Promise<string> {
    const rows = await this.#database
      .select({ value: settings.birthdayPromoText })
      .from(settings)
      .where(eq(settings.id, 1))
      .limit(1)
    const value = rows[0]?.value
    if (!value) throw new Error('Birthday promotion text is missing')
    return value
  }

  /** Lists claimed, non-voided cards eligible for birthday processing. */
  async listClaimedCards(): Promise<BirthdayCard[]> {
    return this.#database
      .select({
        birthday: customers.birthday,
        cardId: cards.id,
        customerId: customers.id,
      })
      .from(customers)
      .innerJoin(cards, eq(cards.customerId, customers.id))
      .where(and(isNotNull(cards.platform), ne(cards.status, 'voided')))
  }

  /** Lists uncleared birthday promotions on currently claimed cards. */
  async listPendingCleanup(): Promise<BirthdayCleanup[]> {
    return this.#database
      .select({
        birthday: customers.birthday,
        cardId: cards.id,
        customerId: customers.id,
        notificationId: birthdayNotifications.id,
        notificationYear: birthdayNotifications.year,
      })
      .from(birthdayNotifications)
      .innerJoin(customers, eq(birthdayNotifications.customerId, customers.id))
      .innerJoin(cards, eq(cards.customerId, customers.id))
      .where(
        and(
          isNull(birthdayNotifications.clearedAt),
          isNotNull(cards.platform),
          ne(cards.status, 'voided')
        )
      )
  }

  /** Lists reserved notifications that have not completed successfully. */
  async listPendingNotifications(): Promise<BirthdayPendingNotification[]> {
    return this.#database
      .select({
        birthday: customers.birthday,
        cardId: cards.id,
        customerId: customers.id,
        notificationYear: birthdayNotifications.year,
      })
      .from(birthdayNotifications)
      .innerJoin(customers, eq(birthdayNotifications.customerId, customers.id))
      .innerJoin(cards, eq(cards.customerId, customers.id))
      .where(
        and(
          isNull(birthdayNotifications.notifiedAt),
          isNotNull(cards.platform),
          ne(cards.status, 'voided')
        )
      )
  }

  /**
   * Marks a promotion cleanup complete after wallet synchronization.
   *
   * @param notificationId - Birthday reservation identifier.
   * @param clearedAt - Cleanup completion time.
   */
  async markCleared(notificationId: string, clearedAt: Date): Promise<void> {
    await this.#database
      .update(birthdayNotifications)
      .set({ clearedAt })
      .where(eq(birthdayNotifications.id, notificationId))
  }

  /**
   * Marks a reserved birthday notification delivered.
   *
   * @param customerId - Birthday customer identifier.
   * @param year - Reservation year.
   * @param notifiedAt - Successful completion time.
   */
  async markNotified(
    customerId: string,
    year: number,
    notifiedAt: Date
  ): Promise<void> {
    await this.#database
      .update(birthdayNotifications)
      .set({ notifiedAt })
      .where(
        and(
          eq(birthdayNotifications.customerId, customerId),
          eq(birthdayNotifications.year, year)
        )
      )
  }

  /**
   * Atomically reserves one annual notification before external work.
   *
   * @param customerId - Birthday customer identifier.
   * @param year - Local notification year.
   * @param attemptedAt - Current retry attempt time.
   */
  async reserve(
    customerId: string,
    year: number,
    attemptedAt: Date
  ): Promise<boolean> {
    const retryBefore = new Date(attemptedAt.getTime() - 60 * 60 * 1000)
    const inserted = await this.#database
      .insert(birthdayNotifications)
      .values({ customerId, lastAttemptAt: attemptedAt, year })
      .onConflictDoUpdate({
        set: { lastAttemptAt: attemptedAt },
        setWhere: and(
          isNull(birthdayNotifications.notifiedAt),
          or(
            isNull(birthdayNotifications.lastAttemptAt),
            lt(birthdayNotifications.lastAttemptAt, retryBefore)
          )
        ),
        target: [birthdayNotifications.customerId, birthdayNotifications.year],
      })
      .returning({ id: birthdayNotifications.id })
    return inserted.length > 0
  }
}
