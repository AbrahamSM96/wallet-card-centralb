import type { AppleRegistrationRepository } from '@/domain/loyalty/repositories'
import type { DatabaseExecutor } from '@/infrastructure/db/client'
import { appleRegistrations } from '@/infrastructure/db/schema'
import { and, eq } from 'drizzle-orm'

/** Persists Apple Wallet device registrations through Drizzle. */
export class DrizzleAppleRegistrationRepository implements AppleRegistrationRepository {
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
   * Lists devices currently registered for a card.
   *
   * @param cardId - Card identifier.
   */
  async listDeviceLibraryIds(cardId: string): Promise<string[]> {
    const rows = await this.#database
      .select({ deviceLibraryId: appleRegistrations.deviceLibraryId })
      .from(appleRegistrations)
      .where(eq(appleRegistrations.cardId, cardId))
    return rows.map((row) => row.deviceLibraryId)
  }

  /**
   * Removes one device-card registration.
   *
   * @param cardId - Card identifier.
   * @param deviceLibraryId - Apple device library identifier.
   */
  async remove(cardId: string, deviceLibraryId: string): Promise<void> {
    await this.#database
      .delete(appleRegistrations)
      .where(
        and(
          eq(appleRegistrations.cardId, cardId),
          eq(appleRegistrations.deviceLibraryId, deviceLibraryId)
        )
      )
  }

  /**
   * Inserts a registration or refreshes its push token.
   *
   * @param cardId - Card identifier.
   * @param deviceLibraryId - Apple device library identifier.
   * @param pushToken - APNs token supplied by Wallet.
   */
  async upsert(
    cardId: string,
    deviceLibraryId: string,
    pushToken: string
  ): Promise<boolean> {
    const inserted = await this.#database
      .insert(appleRegistrations)
      .values({ cardId, deviceLibraryId, pushToken })
      .onConflictDoNothing({
        target: [appleRegistrations.deviceLibraryId, appleRegistrations.cardId],
      })
      .returning({ id: appleRegistrations.id })
    if (inserted.length > 0) return true

    await this.#database
      .update(appleRegistrations)
      .set({ pushToken })
      .where(
        and(
          eq(appleRegistrations.cardId, cardId),
          eq(appleRegistrations.deviceLibraryId, deviceLibraryId)
        )
      )
    return false
  }
}
