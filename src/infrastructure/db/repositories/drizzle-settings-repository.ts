import type { SettingsRepository } from '@/domain/loyalty/repositories'
import type { LoyaltySettings } from '@/domain/loyalty/types'
import type { DatabaseExecutor } from '@/infrastructure/db/client'
import { settings } from '@/infrastructure/db/schema'
import { eq } from 'drizzle-orm'

/** Reads the single loyalty-settings row through Drizzle. */
export class DrizzleSettingsRepository implements SettingsRepository {
  readonly #database: DatabaseExecutor

  /**
   * Creates the repository for one database or transaction executor.
   *
   * @param database - Drizzle executor used by every operation.
   */
  constructor(database: DatabaseExecutor) {
    this.#database = database
  }

  /** Returns the loyalty settings used by domain rules. */
  async get(): Promise<LoyaltySettings | null> {
    const rows = await this.#database
      .select({ stampsRequired: settings.stampsRequired })
      .from(settings)
      .where(eq(settings.id, 1))
      .limit(1)
    return rows[0] ?? null
  }
}
