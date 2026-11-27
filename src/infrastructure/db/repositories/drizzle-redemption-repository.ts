import type {
  NewRedemption,
  RedemptionRepository,
} from '@/domain/loyalty/repositories'
import type { DatabaseExecutor } from '@/infrastructure/db/client'
import { redemptions } from '@/infrastructure/db/schema'

/** Persists reward-redemption audit records through Drizzle. */
export class DrizzleRedemptionRepository implements RedemptionRepository {
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
   * Inserts one reward redemption.
   *
   * @param input - Redemption audit values.
   */
  async create(input: NewRedemption): Promise<void> {
    await this.#database.insert(redemptions).values(input)
  }
}
